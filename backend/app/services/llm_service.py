"""
Groq Cloud LLM Service
Handles AI-powered financial explanations and chat
"""
import json
from groq import Groq
from typing import Dict, List, Optional, Any
from app.config import settings
from app.services.memory_service import memory_service


class GroqService:
    """
    Service for interacting with Groq Cloud LLM
    Provides financial analysis explanations and insights
    """
    
    def __init__(self):
        """Initialize Groq client with API key"""
        key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""
        
        if key and key != "placeholder_key_for_testing":
            try:
                self.client = Groq(api_key=key)
                self.model = settings.GROQ_MODEL
                self.enabled = True
            except Exception as e:
                print(f"Failed to initialize Groq Service: {e}")
                self.client = None
                self.enabled = False
        else:
            self.client = None
            self.enabled = False
    
    def _chat(self, prompt: str, system_prompt: str = None) -> str:
        """
        Send a chat completion request to Groq.
        Returns the text content of the response.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.4,
            max_tokens=4096,
        )
        return response.choices[0].message.content

    def generate_financial_explanation(
        self,
        user_message: str,
        computed_metrics: Optional[Dict] = None,
        company_context: Optional[Dict] = None,
        user_id: Optional[str] = None,
        available_companies: Optional[List[str]] = None,
        message_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Generate AI explanation for financial queries
        """
        if not self.enabled:
            return self._get_fallback_response(user_message, computed_metrics)
        
        try:
            # 1. Retrieve user profile and past relevant context from memory
            user_profile = "Standard professional tone."
            past_context = []
            
            if user_id:
                user_profile = memory_service.get_user_profile_context(user_id)
                # We still retrieve from vector memory for long-term facts
                past_context = memory_service.retrieve_context(user_message, filters={"user_id": user_id})
            
            # 2. Build adaptive prompt
            user_prompt, system_prompt = self._build_prompt(
                user_message, 
                computed_metrics, 
                company_context, 
                user_profile=user_profile,
                past_context=past_context,
                available_companies=available_companies,
                message_history=message_history
            )
            
            print("\n" + "="*50)
            print("PROMPT SENT TO LLM:")
            print("-"*50)
            print(f"SYSTEM: {system_prompt[:200]}...")
            print(f"USER: {user_prompt}")
            print("="*50 + "\n")
            
            return self._chat(user_prompt, system_prompt=system_prompt)
        except Exception as e:
            print(f"Groq API Error: {str(e)}")
            return self._get_fallback_response(user_message, computed_metrics)

    def parse_intent(self, user_message: str) -> Dict:
        """
        Detect user intent and return structured command
        """
        if not self.enabled:
            return {"intent": "unknown", "action": "none"}

        prompt = f"""Analyze the user's financial platform request and identify the primary intent.
        
        USER REQUEST: "{user_message}"
        
        Identify one of the following intents:
        - "add_client": User wants to onboard a new company.
        - "compare_clients": User wants to compare multiple companies.
        - "analyze_performance": User wants a deep dive into a specific client's data.
        - "general_query": Financial questions or general platform help.
        
        Return ONLY a JSON object with this format:
        {{
          "intent": "intent_name",
          "action": "frontend_action_trigger",
          "params": {{ "key": "value" }},
          "confidence": 0.0-1.0
        }}
        """
        
        try:
            content = self._chat(prompt).strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            return json.loads(content)
        except Exception as e:
            print(f"Intent Parsing Error: {e}")
            return {"intent": "general_query", "action": "none", "confidence": 0.0}
    
    def _build_prompt(
        self,
        user_message: str,
        computed_metrics: Optional[Dict],
        company_context: Optional[Dict],
        user_profile: Optional[str] = None,
        past_context: Optional[List[str]] = None,
        available_companies: Optional[List[str]] = None,
        message_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Build context-aware, adaptive prompt
        CRITICAL: Only includes computed metrics, never raw financial data
        """
        prompt_parts = []
        
        # System context
        companies_str = ", ".join(available_companies) if available_companies else "the companies in your database"
        
        SYSTEM_PROMPT = f"""
You are a smart and interactive **Financial Data Assistant**. Your job is to help users explore company data, financial reports, and key insights.

====================================================
🚨 CONVERSATION PRINCIPLES (NLP AWARENESS)
====================================================
1. **Maintain Context**: You MUST remember the "active" company or topic discussed in previous turns.
2. **Resolve References**: If the user says "its", "their", "that company", or similar, resolve it to the most recently discussed entity.
3. **Implicit Confirmation**: If the user asks for "Chairman's message" after discussing "Tata Motors", assume they want the one for Tata Motors immediately.
4. **Natural Flow**: Do not reset the context unless the user explicitly switches to a different company.
5. **Short & Precise**: Keep responses under 6 lines. Always suggest a logical next step.

====================================================
🏢 AVAILABLE COMPANIES
====================================================
{companies_str}
"""
        
        # Start building user prompt
        
        # 1. Recent Chat History (Most Important for NLP Flow)
        if message_history:
            prompt_parts.append("RECENT CONVERSATION HISTORY:\n")
            for msg in message_history[-5:]:  # Last 5 messages for focus
                role_label = "User" if msg['role'] == 'user' else "Assistant"
                prompt_parts.append(f"{role_label}: {msg['content']}\n")
            prompt_parts.append("\n")

        # 2. Long-term memory / Facts
        if past_context:
            prompt_parts.append("RELEVANT PAST KNOWLEDGE:\n")
            for ctx in past_context:
                prompt_parts.append(f"  - {ctx}\n")
            prompt_parts.append("\n")

        # 3. Active Company Context
        if company_context:
            prompt_parts.append(f"CURRENT ACTIVE CONTEXT: {company_context.get('name', 'Unknown')}\n")
            if company_context.get('industry'):
                prompt_parts.append(f"Industry: {company_context['industry']}\n")
            prompt_parts.append("\n")
        
        # 4. Data grounding
        if computed_metrics:
            prompt_parts.append("COMPUTED FINANCIAL METRICS FOR ACTIVE CONTEXT:\n")
            prompt_parts.append(self._format_metrics(computed_metrics))
            prompt_parts.append("\n")
        
        # 5. Current Message
        prompt_parts.append(f"LATEST USER MESSAGE: {user_message}\n")
        prompt_parts.append("Respond as a helpful, conversationally-aware analyst:")
        
        return "".join(prompt_parts), SYSTEM_PROMPT
    
    def _format_metrics(self, metrics: Dict) -> str:
        """Format metrics for prompt context"""
        formatted = []
        
        for metric_name, metric_value in metrics.items():
            if metric_value is not None:
                display_name = metric_name.replace('_', ' ').title()
                
                if isinstance(metric_value, float):
                    if 'ratio' in metric_name or 'margin' in metric_name:
                        formatted.append(f"  - {display_name}: {metric_value:.2f}")
                    else:
                        formatted.append(f"  - {display_name}: {metric_value:.2%}")
                else:
                    formatted.append(f"  - {display_name}: {metric_value}")
        
        return "\n".join(formatted)
    
    def _get_fallback_response(
        self,
        user_message: str,
        computed_metrics: Optional[Dict]
    ) -> str:
        """
        Fallback response when Groq is not available
        Provides basic analysis based on metrics
        """
        if not computed_metrics:
            return """I'm ready to analyze financial data, but I need computed metrics first. 
Please upload financial statements and run the analysis to get ratio calculations, 
then I can provide detailed insights."""
        
        response_parts = ["Based on the computed financial metrics:\n"]
        
        if 'current_ratio' in computed_metrics:
            cr = computed_metrics['current_ratio']
            if cr >= 2.0:
                response_parts.append(f"✓ Strong liquidity with Current Ratio of {cr:.2f}")
            elif cr >= 1.5:
                response_parts.append(f"✓ Adequate liquidity with Current Ratio of {cr:.2f}")
            elif cr >= 1.0:
                response_parts.append(f"⚠ Moderate liquidity concern - Current Ratio is {cr:.2f}")
            else:
                response_parts.append(f"⚠ Critical liquidity risk - Current Ratio below 1.0 ({cr:.2f})")
        
        if 'return_on_equity' in computed_metrics:
            roe = computed_metrics['return_on_equity']
            if roe >= 15:
                response_parts.append(f"✓ Excellent profitability with ROE of {roe:.2f}%")
            elif roe >= 10:
                response_parts.append(f"✓ Good profitability with ROE of {roe:.2f}%")
            else:
                response_parts.append(f"⚠ Below-average profitability - ROE is {roe:.2f}%")
        
        if 'debt_to_equity' in computed_metrics:
            dte = computed_metrics['debt_to_equity']
            if dte < 0.5:
                response_parts.append(f"✓ Conservative debt levels (D/E: {dte:.2f})")
            elif dte < 1.0:
                response_parts.append(f"✓ Moderate debt levels (D/E: {dte:.2f})")
            else:
                response_parts.append(f"⚠ High debt burden (D/E: {dte:.2f})")
        
        response_parts.append("\nNote: For detailed AI-powered analysis, configure GROQ_API_KEY in your .env file.")
        
        return "\n".join(response_parts)
    
    def analyze_trends(
        self,
        metric_name: str,
        trend_data: Dict
    ) -> str:
        """Generate explanation for trend analysis"""
        if not self.enabled:
            return f"Trend analysis for {metric_name}: {trend_data.get('trend_direction', 'unknown')}"
        
        prompt = f"""Analyze this financial trend:

Metric: {metric_name}
Trend Direction: {trend_data.get('trend_direction', 'unknown')}
CAGR: {trend_data.get('cagr', 'N/A')}%
Volatility: {trend_data.get('volatility', 'N/A')}

Provide:
1. What this trend indicates
2. Potential causes
3. Implications for the business
4. Recommendations
"""
        
        try:
            return self._chat(prompt)
        except Exception as e:
            return f"Trend analysis: {trend_data.get('trend_direction', 'unknown')} trend detected for {metric_name}"
    
    def explain_health_score(
        self,
        health_score: float,
        risk_level: str,
        red_flags: List[str],
        warnings: List[str]
    ) -> str:
        """Generate explanation for health score"""
        if not self.enabled:
            return f"Financial Health Score: {health_score}/100 - Risk Level: {risk_level}"
        
        prompt = f"""Explain this financial health assessment:

Overall Score: {health_score}/100
Risk Level: {risk_level}

Red Flags: {', '.join(red_flags) if red_flags else 'None'}
Warnings: {', '.join(warnings) if warnings else 'None'}

Provide:
1. Overall assessment
2. Key concerns
3. Strengths
4. Action items for improvement
"""
        
        try:
            return self._chat(prompt)
        except Exception as e:
            return f"Health Score: {health_score}/100. Risk Level: {risk_level}. {'Red flags detected.' if red_flags else 'No critical issues.'}"


# Singleton instance
groq_service = GroqService()

# Backward-compatible alias so existing imports still work
gemini_service = groq_service
