const cloudbase = require("@cloudbase/node-sdk");

exports.main = async (event) => {
  const { topicId, callerUid, callerRole } = event;

  if (!topicId) {
    return { success: false, error: "缺少话题ID" };
  }
  if (!callerUid) {
    return { success: false, error: "未登录" };
  }

  try {
    const app = cloudbase.init({});
    const db = app.database();
    const _ = db.command;

    // Find the topic
    const res = await db.collection("blog_topics").doc(topicId).get();
    const topic = res.data?.[0];
    if (!topic) {
      return { success: false, error: "话题不存在" };
    }

    // Check permission: admin or topic author
    const isAdmin = callerRole === "admin";
    const isAuthor = topic.authorId === callerUid;

    if (!isAdmin && !isAuthor) {
      return { success: false, error: "没有删除权限" };
    }

    // Delete topic, its comments, and likes
    await db.collection("blog_topics").doc(topicId).remove();
    await db.collection("blog_topic_comments").where({ topicId: _.eq(topicId) }).remove();
    await db.collection("blog_topic_likes").where({ topicId: _.eq(topicId) }).remove();

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "删除失败" };
  }
};
