import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { soulCloneAgent } from './agents/soul-clone-agent';
import { solarGetPostsTool, solarGetProfileTool } from './tools/solar-tools';

const mastraDbPath = process.env.MASTRA_DB_PATH?.trim() || 'file:./mastra.db';
const mastraDbUrl = mastraDbPath.startsWith('file:') ? mastraDbPath : `file:${mastraDbPath}`;

export const mastra = new Mastra({
  workflows: {},
  agents: { soulCloneAgent },
  tools: {
    solarGetProfile: solarGetProfileTool,
    solarGetPosts: solarGetPostsTool,
  },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: mastraDbUrl,
    }),
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(),
          new CloudExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
});
