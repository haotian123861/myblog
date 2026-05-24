const cloudbase = require("@cloudbase/node-sdk");
const bcrypt = require("bcryptjs");

exports.main = async (event) => {
  const { username, password, nickname } = event;

  if (!username || !password) {
    return { success: false, error: "请填写用户名和密码" };
  }

  try {
    const app = cloudbase.init({});
    const db = app.database();
    const _ = db.command;

    // Check if username already exists
    const existing = await db
      .collection("blog_users")
      .where({ username: _.eq(username) })
      .get();

    const existingList = Array.isArray(existing.data)
      ? existing.data
      : [];
    if (existingList.length > 0) {
      return { success: false, error: "用户名已存在" };
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Store user in database
    const now = new Date().toISOString();
    const userData = {
      username,
      password: hashedPassword,
      nickname: (nickname || username).slice(0, 30) || "用户",
      role: "user",
      createdAt: now,
    };

    const result = await db.collection("blog_users").add(userData);

    return {
      success: true,
      uid: result.id,
      username,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "注册失败",
    };
  }
};
