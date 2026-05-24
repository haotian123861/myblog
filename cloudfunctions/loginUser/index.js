const cloudbase = require("@cloudbase/node-sdk");
const bcrypt = require("bcryptjs");

exports.main = async (event) => {
  const { username, password } = event;

  if (!username || !password) {
    return { success: false, error: "请填写用户名和密码" };
  }

  try {
    const app = cloudbase.init({});
    const db = app.database();
    const _ = db.command;

    // Find user by username
    const result = await db
      .collection("blog_users")
      .where({ username: _.eq(username) })
      .get();

    const users = Array.isArray(result.data) ? result.data : [];
    if (users.length === 0) {
      return { success: false, error: "用户名或密码错误" };
    }

    const user = users[0];

    // Compare password
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return { success: false, error: "用户名或密码错误" };
    }

    // Return user info without password
    const { password: _pwd, ...safeUser } = user;

    return {
      success: true,
      user: safeUser,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "登录失败",
    };
  }
};
