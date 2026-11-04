# 阶段 06 Media Controller 调用关系专题页实施计划

1. 新增失败测试，锁定 30–32 文件、导航、共享站点壳、三种连线和关键函数。
2. 实现专题 30：Media 对象归属、pad 初始化、link/backlink/reverse。
3. 实现专题 31：notifier/subdev 两种注册顺序与统一 match_notify 状态迁移。
4. 实现专题 32：D-PHY bound、RKISP complete、局部/全局建链与证据边界。
5. 在 21 总览增加三个真实专题入口，并形成 `21→30→31→32→22` 导航。
6. 运行局部测试、全站测试、链接检查与 `git diff --check`；WSL 基线不可用时单独记录环境失败。
