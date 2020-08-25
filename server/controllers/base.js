
class baseController {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async init(ctx) {
    this.$user = null;

   /* let ignoreRouter = [
      '/api/user/login_by_token',
      '/api/user/login',
      '/api/user/reg',
      '/api/user/status',
      '/api/user/logout',
      '/api/user/avatar',
      '/api/user/login_by_ldap'
    ];
    if (ignoreRouter.indexOf(ctx.path) > -1) {
      this.$auth = true;
    } else {
      await this.checkLogin(ctx);
    }*/
    let params = Object.assign({}, ctx.query, ctx.request.body);
    let token = params.token;
    if (token) {
      console.log('有 token')
    } else {
      console.log('无 token')
    }
    this.$auth = true; // 默认设置为true
  }

  async checkLogin(ctx) {
    let token = ctx.cookies.get('_yapi_token');
    let uid = ctx.cookies.get('_yapi_uid');
    try {
      if (!token || !uid) {
        return false;
      }
      let userInst = yapi.getInst(userModel); //创建user实体
      let result = await userInst.findById(uid);
      if (!result) {
        return false;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, result.passsalt);
      } catch (err) {
        return false;
      }

      if (decoded.uid == uid) {
        this.$uid = uid;
        this.$auth = true;
        this.$user = result;
        return true;
      }

      return false;
    } catch (e) {
      console.log(e, 'error');
      return false;
    }
  }

}
module.exports = baseController;
