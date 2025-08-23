// 任务相关的最小白名单键
const KEEP_KEYS = new Set([
  "name", "type", "width", "height",
  "characters", // 只保留文本内容
  // 视需求可加："layoutMode"
]);

function slimNode(n) {
  // 跳过"显式标明要优化跳过"的节点
  if (n?.skippedByOptimize === true) return null;

  // 只保留白名单字段
  const slim = {};
  for (const k in n) {
    if (KEEP_KEYS.has(k)) slim[k] = n[k];
  }

  // 仅当是文本节点时保留 characters；否则确保没有大字段
  if (n.type === "TEXT") {
    slim.characters = (n.characters || "").slice(0, 2000); // 防守式截断
  }

  // 递归 children，但限制数量，避免超深/超长
  if (Array.isArray(n.children)) {
    const filtered = n.children
      .map(slimNode)
      .filter(Boolean);
    // 可按任务过滤：仅保留 TEXT / FRAME / GROUP
    slim.children = filtered.filter(c =>
      ["TEXT", "FRAME", "GROUP"].includes(c.type)
    ).slice(0, 2000); // 上限，别让它炸
  }

  // 没有有用信息就返回 null
  if (!slim.name && !slim.type && !slim.characters && !slim.children?.length) {
    return null;
  }
  return slim;
}

// 顶层调用
function buildSlimPayload(raw) {
  const slim = slimNode(raw);
  // 再做一次"结构摘要"，只传必要片段
  return {
    doc: slim,
    task: "Summarize structure and surface texts; ignore visuals."
  };
}

module.exports = { buildSlimPayload };
