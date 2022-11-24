---
title: Java 基础面试题（上）
tags:
  - 面试宝典
  - 基础
onShowH2: true
created: 2022-11-22 09:22:06
modified: 2022-11-22 09:22:06
number headings: auto, first-level 1, max 6, _.1.1.
---

# Java 基础面试题（上）

## 1. 访问修饰符 public、private、protected、以及不写（默认）时的区别？

Java 支持 4 种不同的访问权限。

- **private**：在本类中可见。使用对象：类（不能是外部类）、属性、方法。
- **default**（及默认，什么也不写）：同一个包内可见，不使用任何修饰符。使用对象：类、接口、属性、方法。
- **protected**：对同一个包内的类和所有的子类可见。使用对象：类（不能是外部类）、属性、方法。
- **public**：对所有类都可见。使用对象：类、接口、属性、方法。

| 修饰符    | 本类 | 本包 | 子类 | 其他包 |
| --------- | ---- | ---- | ---- | ------ |
| public    | Y    | Y    | Y    | Y      |
| protected | Y    | Y    | Y    | N      |
| default   | Y    | Y    | N    | N      |
| private   | Y    | N    | N    | N      |

## 2. final、finally、finalize 的区别？

三者并没有任何关系。

- final 是 Java 语言中的一个关键字，使用 final 修饰的对象不允许修改或替换其原始值或定义。final 可以用来修饰类、方法、变量和参数。当 final 修饰类时表示此类不可被继承，所有的方法都不能被重写，表示此类设计的很完美，不需要被修改和扩展；当 final 修饰方法时，表示此方法不允许任何子类重写该方法，表示此方法提供的功能已经满足当前要求，不需要进行扩展；当 final 修饰变量时，通常称被修饰的变量为常量，表示该变量一旦被初始化便不可以被修改；当 final 修饰参数时，表示此参数在整个方法内不允许被修改。
- finally 则是 Java 中保证重点代码一定被执行的一种机制，咱们可以使用 try-finally 或 try-catch-finally 来进行类似关闭 JDBC 连接、释放锁等动作。finally 一定会被执行吗？这是一个有诱导嫌疑的问题，正常情况下，finally 一定是会执行的，但是存在一个特殊情况 finally 是不会执行的，如下：

  ```java
  try{
      LOGGER.debug("执行try中的代码");
      System.exit(0);
  }finally {
      LOGGER.debug("执行finally中的代码");
  }
  ```

  运行之后，便可以发现 finally 中的代码并没有执行到。

- finalize 是 Object 类中的一个基础方法，它的设计目的是用于保证对象在被垃圾收集前完成特定资源的回收，但在 JDK9 中已经被标记为弃用的方法，在实际开发中不推荐使用 finalize 方法，它虽然被创造出来，但无法保证 finalize 方法一定会被执行，所以不要依赖它释放任何资源，因为它的执行极不“稳定”，在 JDK9 中将它废弃也很好的证明了此观点。
