import config from "../../config/index.js";
import logger from "../../config/logger.js";

/**
 * Handle AI support assistant inquiries.
 * TODO: Implement full OpenRouter API integration.
 * The OpenRouter key is loaded in config.OPENROUTER_API_KEY.
 * The selected model is loaded in config.SUPPORT_MODEL.
 */
export const handleSupportChat = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: { message: "Messages history array is required" }
      });
    }

    logger.info("Received support chat request. Input size: %d", messages.length);

    const systemPrompt = `You are the LifeLink AI Support Assistant, a helpful and professional support AI for the LifeLink real-time organ donation matching platform.
Your primary role is to assist patients, donors, and healthcare coordinators with inquiries about the platform's workflows, matching rules, and requirements.

### Key Platform Knowledge:
1. Matching Scoring Weights:
   - Blood Group Match Quality: 20%
   - Medical Urgency & Waitlist Duration: 30%
   - Geographic Proximity: 20%
   - HLA Tissue Typing Match: 20%
   - Size/Age Compatibility: 10% (5% weight size, 5% age match)
2. Travel Distance / Cold Ischemia Time (CIT) Geographic Limits:
   - Heart / Lung: Maximum travel distance limit is 400 km (~4 hours CIT limit).
   - Liver / Pancreas: Maximum travel distance limit is 1200 km (~12 hours CIT limit).
   - Kidney: Maximum travel distance limit is 2000 km.
   - If distance exceeds these limits, compatibility is clinically unviable, and the match score returns null.
3. HLA Tissue Matching Loci:
   - Measures compatibility across 6 loci: Locus A (a1, a2), Locus B (b1, b2), and Locus DR (dr1, dr2). Mismatches decrease the matching score.
4. User Profiles:
   - Users can update their blood group, weight, age, coordinate location, and HLA typing alleles.
   - Donors must toggle explicit consent and select organs they wish to donate.
   - Donors/recipients upload identity proof or medical documents to be verified by administrators.
5. Verification Document Status:
   - Document status levels: PENDING, VERIFIED, REJECTED. Donors become active when verified, consent is toggled true, and availability is active.

### Interaction Guidelines:
- Be warm, professional, concise, and helpful.
- Present matches, geographic parameters, and medical parameters clearly.
- IMPORTANT: You are an AI Support Assistant, not a medical doctor or legal adviser. If asked for diagnoses, treatment recommendations, or specific legal advice, politely refuse, state you are an AI assistant, and redirect them to contact their healthcare provider or transplant coordinator.
- Keep your answers concise and directly related to the user support request.`;

    const openRouterKey = config.OPENROUTER_API_KEY;
    const model = config.SUPPORT_MODEL || "google/gemini-2.5-flash";

    if (!openRouterKey) {
      logger.warn("OpenRouter API key is missing. Falling back to stub support response.");
      return res.status(200).json({
        success: true,
        data: {
          role: "assistant",
          content: "I am currently in setup mode. Please contact the administrator to activate my OpenRouter key!"
        }
      });
    }

    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 1000
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "LifeLink Organ Donation AI Support"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("OpenRouter API response error: %s", errorText);
      throw new Error(`OpenRouter returned status ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const replyMessage = json.choices?.[0]?.message;

    if (!replyMessage) {
      throw new Error("Invalid response format received from OpenRouter");
    }

    return res.status(200).json({
      success: true,
      data: replyMessage
    });
  } catch (error) {
    logger.error({ error }, "Error in handleSupportChat controller");
    next(error);
  }
};
