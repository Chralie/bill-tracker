// 小程序入口文件

App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'your-env-id', // TODO: 替换为你的云开发环境 ID
      traceUser: true,
    });
  },
});
