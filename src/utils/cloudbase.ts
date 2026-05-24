// CloudBase SDK 已移除，所有功能已迁移到自建后端 API
// 数据操作请使用 ./api.ts 和 ./db.ts
// AI 对话功能通过 server/src/routes/ai.js 代理

export const ENV_ID = "";
export const isValidEnvId = false;

export const checkEnvironment = () => {
  console.warn("CloudBase 已弃用，请使用自建后端 API");
  return false;
};

export const app = null as any;
export const auth = null as any;
export const database = null as any;
export const cmd = null as any;
export const callFunction = null as any;
export const uploadFile = null as any;
export const getTempFileURL = null as any;
export const deleteFile = null as any;
