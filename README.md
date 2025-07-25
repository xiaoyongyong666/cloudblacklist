<p align="center">
 <img width="100px" src="http://static.starpixel.club/img/logo/logo2kx2k.png" align="center" alt="Starpixe ICON" />
 <h2 align="center" style="background: linear-gradient(to right, #81ff4fff, #ae67ffff, #f8f83dff, #00ff00, #0000ff, #4b0082, #9400d3); -webkit-background-clip: text; background-clip: text; color: transparent;">SP Cloud Blacklist</h2>
 <p align="center">搭建你的个人云端黑名单来维护你的社区</p>
 <div>
 <img src="https://img.shields.io/badge/node-v18.20.0-blue" alt= "node-v18.20.0" />
 <img src="https://img.shields.io/badge/MySQL-v5.7.26-red" alt= "mysql-v5.7.26" />
 <img src="https://img.shields.io/badge/lasted-v1.0.2_7.23-green" alt= "lasted-v1.0.2-beta_7.23" />
 <img src="https://img.shields.io/badge/QQ-1163246049-purple" alt= "QQ-1163246049" />
 <img src="https://img.shields.io/badge/WeChat-wx__zy0202-DAB327" alt= "wechat-wx_zy0202" />
 <img src="https://img.shields.io/badge/ReadMe-v1.2.1-9cf" alt= "readme-v1.2.1" />
 </div>
 <br>
</p>

  <p align="center">
    <a href="https://demo.starpixel.club/spcb">查看 Demo</a>
    ·
    <a href="https://github.com/xiaoyongyong666/cloudblacklist/issues/new">报告 Bug</a>
  </p>
</p>
<p align="center">喜欢这个项目？请考虑<a href="https://starpixel.club/archives/80">捐赠</a>来帮助它完善！


# 准备开始
> [!WARNING]
> 本项目基于 Node v18.20.0 + MySQL v5.7.26 开发 <br>
> 其余版本请自行测试 <br>
> 本文档版本 v1.2.2 所对应代码版本 v1.0.2_7.23

准备好所需的运行环境后，您可以通过以下步骤来开始使用本项目：
1. 克隆或下载本项目到本地
2. 进入项目目录，运行 `npm install` 安装依赖 <br> ( **根据您的包管理器自行选择安装方式** )
3. 运行 `npm run start` 启动项目 <br> ( **根据您的包管理器自行选择启动方式** )
4. 访问 `http://localhost:3000/install` 进行系统安装后即可使用
5. 推荐您在安装完成后重新启动一次本项目获取更加优质的体验

# 系统自定义
- **数据库配置**：在 `install.lock` 中修改数据库配置
- **端口配置**：在 `settings/port.json` 中修改端口配置
- **样式配置**：在 `public/css/style.css` 中修改您的样式

# 系统更新
- 在 `http://localhost:端口号/admin/update` 查看最新的更新内容
- 除有关于数据库声明外 您可以备份您的数据库数据然后下载最新版本覆盖当前版本 **需重新设置数据库连接配置**
- **注意**：在更新前请确保您已经备份了您的数据库数据 出现数据丢失等问题请自行承担后果
- 更新是非必要的 如果您已修改过源代码 请自行对比最新版本进行修改 出现问题请自行承担后果 可选择有偿更新
- **注意**：如果您在更新过程中遇到任何问题 请及时联系作者

# Todo:

| 更新项目 |           内容         |  完成  |    日期    |  状态  |
| :-----: | :--------------------: | :----: | :-------: | :----: |
| 图片管理 | 添加快捷图片上传导入功能 |   ✅   | 2025.07.08 | 已上线 |
| 安装系统 | 添加一键快速迅捷安装系统 |   ✅   | 2025.07.09 | 已上线 |
| 接口重构 | 重构接口使其更加简洁快速 |   ✅   | 2025.07.20 | 已上线 |
| 逻辑优化 | 优化部分逻辑使其更加高效 |   ✅   | 2025.07.20 | 已上线 |
| 自定端口 | 自定义端口使其更加的安全 |   ✅   | 2025.07.23 | 已上线 |
| 更改密码 | 更改后台管理密码保证安全 |   ❌   |    NULL    | 待排期 |
| 日志管理 | 日志系统使系统运作透明化 |   ❌   |    NULL    | 待排期 |
| 系统管理 | 快捷管理系统设置优化整站 |   ❌   |    NULL    | 待排期 |
| 使用文档 | 可使系统更方便且快速上手 |   ❌   |    NULL    | 待排期 |

# License

本项目根据 **GNU通用公共许可证v3.0(GPL-3.0)** 获得许可
有关完整的许可证文本，请参阅 [LICENSE](LICENSE.txt)

## 关键要求：
- **您必须披露任何衍生作品的源代码**
- **您必须保留本许可和版权声明** 的所有副本
- **衍生作品也必须根据GPL-3.0** 获得许可
