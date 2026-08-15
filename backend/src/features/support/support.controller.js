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

    // TODO: Send request to OpenRouter chat completion API:
    // API endpoint: https://openrouter.ai/api/v1/chat/completions
    // Headers:
    //   Authorization: Bearer <OPENROUTER_API_KEY>
    //   Content-Type: application/json
    // Body:
    //   model: <SUPPORT_MODEL>
    //   messages: [systemInstructionPrompt, ...messages]
    
    // For now, return a placeholder stub response for development testing:
    const mockReply = {
      role: "assistant",
      content: "Hello! I am your LifeLink AI Support Assistant. I am currently in setup mode. Tomorrow we will activate the full OpenRouter model connection!"
    };

    return res.status(200).json({
      success: true,
      message: mockReply
    });
  } catch (error) {
    logger.error({ error }, "Error in handleSupportChat controller");
    next(error);
  }
};
