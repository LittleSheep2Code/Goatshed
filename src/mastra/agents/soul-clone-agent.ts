import {Agent, type DynamicArgument} from "@mastra/core/agent";
import type {OpenAICompatibleConfig} from "@mastra/core/llm";
import type {RequestContext} from "@mastra/core/request-context";
import {Memory} from "@mastra/memory";
import {solarGetPostsTool, solarGetProfileTool} from "../tools/solar-tools";

const DEFAULT_CLONE_AGENT_MODEL = "deepseek/deepseek-chat";
const DEFAULT_CLONE_AGENT_MULTIMODAL_MODEL = "google/gemini-2.5-flash";

export const cloneAgentModel =
    process.env.CLONE_AGENT_MODEL?.trim() ||
    process.env.NUXT_CLONE_AGENT_MODEL?.trim() ||
    DEFAULT_CLONE_AGENT_MODEL;

export const cloneAgentMultimodalModel =
    process.env.CLONE_AGENT_MULTIMODAL_MODEL?.trim() ||
    process.env.NUXT_CLONE_AGENT_MULTIMODAL_MODEL?.trim() ||
    DEFAULT_CLONE_AGENT_MULTIMODAL_MODEL;

const cloneAgentModelUrl =
    process.env.CLONE_AGENT_MODEL_URL?.trim() ||
    process.env.NUXT_CLONE_AGENT_MODEL_URL?.trim() ||
    process.env.CLONE_AGENT_BASE_URL?.trim() ||
    process.env.NUXT_CLONE_AGENT_BASE_URL?.trim() ||
    "";

const cloneAgentModelApiKey =
    process.env.CLONE_AGENT_MODEL_API_KEY?.trim() ||
    process.env.NUXT_CLONE_AGENT_MODEL_API_KEY?.trim() ||
    process.env.CLONE_AGENT_API_KEY?.trim() ||
    process.env.NUXT_CLONE_AGENT_API_KEY?.trim() ||
    "";

const cloneAgentMultimodalModelUrl =
    process.env.CLONE_AGENT_MULTIMODAL_MODEL_URL?.trim() ||
    process.env.NUXT_CLONE_AGENT_MULTIMODAL_MODEL_URL?.trim() ||
    cloneAgentModelUrl;

const cloneAgentMultimodalModelApiKey =
    process.env.CLONE_AGENT_MULTIMODAL_MODEL_API_KEY?.trim() ||
    process.env.NUXT_CLONE_AGENT_MULTIMODAL_MODEL_API_KEY?.trim() ||
    cloneAgentModelApiKey;

function stripProviderPrefix(modelId: string) {
    const trimmed = modelId.trim();
    const slashIndex = trimmed.indexOf("/");
    if (slashIndex === -1) return trimmed;
    return trimmed.slice(slashIndex + 1);
}

const openAiCompatibleModelId = stripProviderPrefix(cloneAgentModel);
const openAiCompatibleMultimodalModelId = stripProviderPrefix(cloneAgentMultimodalModel);

export type CloneAgentModelConfig = string | OpenAICompatibleConfig;

export function getCloneAgentModelConfig(isMultimodal: boolean): CloneAgentModelConfig {
    if (isMultimodal) {
        if (cloneAgentMultimodalModelUrl && cloneAgentMultimodalModelApiKey) {
            return {
                id: `openai/${openAiCompatibleMultimodalModelId}`,
                url: cloneAgentMultimodalModelUrl,
                apiKey: cloneAgentMultimodalModelApiKey,
            };
        }
        return cloneAgentMultimodalModel;
    }
    if (cloneAgentModelUrl && cloneAgentModelApiKey) {
        return {
            id: `openai/${openAiCompatibleModelId}`,
            url: cloneAgentModelUrl,
            apiKey: cloneAgentModelApiKey,
        };
    }
    return cloneAgentModel;
}

export const REQUEST_CONTEXT_MULTIMODAL_KEY = "cloneAgentIsMultimodal";

const cloneAgentModelResolver: DynamicArgument<CloneAgentModelConfig> = ({requestContext}: {requestContext?: RequestContext}) => {
    const isMultimodal = requestContext?.get(REQUEST_CONTEXT_MULTIMODAL_KEY) === true;
    return getCloneAgentModelConfig(isMultimodal);
};

function parseBooleanEnv(value: string | undefined) {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return null;
}

export const cloneAgentReasoningOverride = parseBooleanEnv(
    process.env.CLONE_AGENT_REASONING ?? process.env.NUXT_CLONE_AGENT_REASONING,
);

export function isCloneAgentReasoningEnabled() {
    if (typeof cloneAgentReasoningOverride === "boolean") {
        return cloneAgentReasoningOverride;
    }
    return false;
}

const soulCloneSystemPrompts: string[] = [
    "你正在扮演一个数字分身，分身主人的性格以及信息都在 SOUL.md 中包含了",
    "身份安全规则：请勿捏造当前聊天记录或 SOUL.md 中未提及的记忆、关系、私人经历或个人信息。如有任何疑问，请明确说明。",
    "始终保持回答简洁，扮演时使用第一人称，并在特殊情况下说明你是数字分身。",
    "当用户询问关于 Solar Network 的信息时（如个人资料、帖子或动态等）请使用工具而不是猜测。"
];

export const soulCloneAgent = new Agent({
    id: "soul-clone-agent",
    name: "Soul Clone Agent",
    instructions: [
        ...soulCloneSystemPrompts.map((prop) => ({
            role: "system",
            content: prop
        }))
    ],
    model: cloneAgentModelResolver,
    tools: {
        solarGetProfile: solarGetProfileTool,
        solarGetPosts: solarGetPostsTool,
    },
    memory: new Memory(),
});
