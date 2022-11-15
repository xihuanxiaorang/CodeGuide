---
title: Spring-ConfigurationClassPostProcessor后置处理器详解
tags:
  - spring
  - 源码
created: 2022-10-23 04:51:03
modified: 2022-10-23 04:51:03
number headings: auto, first-level 1, max 6, _.1.1.
---

# Spring-ConfigurationClassPostProcessor后置处理器详解

## 1. 何时注册的后置处理器？

1. 记性好的小伙伴可能还记得在 [Spring-BeanDefinition加载流程分析](Spring-BeanDefinition加载流程分析.md) 这一篇文章的 `2.3.3.2.3` 小节中，最后会调用 `AnnotationConfigUtils` 工具类中的 `registerAnnotationConfigProcessors()` 方法 **往 Spring 容器中注册一些与注解有关的后置处理器的 bean 定义信息**，注册的后置处理器中就包括今天源码分析时的主角，`ConfigurationClassPostProcessor` 后置处理器。
2. 上面这种方式是在使用 `ClassPathXmlApplicationContext` 上下文解析 `XML` 配置文件加载 `bean` 定义信息时注册的该后置处理器，如果咱们是基于注解开发的话，就会使用 `AnnotationConfigApplicationContext` 上下文，在 `AnnotationConfigApplicationContext` 的构造函数中，

   ```java
   public AnnotationConfigApplicationContext(Class<?>... componentClasses) {
       this();
       register(componentClasses);
       refresh();
   }
   ```

   无参构造函数 `this();`⤵
   
   ```java
	public AnnotationConfigApplicationContext() {  
	    /**  
	    * 先隐式调用其父类 GenericApplicationContext 的构造函数  
	    * 其父类构造函数里初始化了 DefaultListableBeanFactory，并赋值给 BeanFactory  
	    * 然后再运行其本类构造，即执行下面的逻辑  
       */  
      StartupStep createAnnotatedBeanDefReader = this.getApplicationStartup().start("spring.context.annotated-bean-reader.create");  
	 
	    /**  
	    * 初始化一个 Bean 的读取器  
	    * 创建一个（注解版的）BeanDefinition 读取器  
	    * 加载了底层功能组件的后置处理器的 BeanDefinition  
	    */   
   	this.reader = new AnnotatedBeanDefinitionReader(this);  
		createAnnotatedBeanDefReader.end();  
	    /**  
	    * 初始化一个扫描器  
	    * 创建一个类路径下的扫描器，可以用来扫描包或者类，继而转换为 BeanDefinition  
	    * Spring 默认的扫描包所使用的扫描器，并不是这个 scanner 对象，  
	    * 而是在执行后置处理器 ConfigurationClassPostProcessor 去扫描包时会新创建一个 ClassPathBeanDefinitionScanner 对象  
	    * 这里的 scanner 仅仅是为了程序员可以手动调用 AnnotationConfigApplicationContext#scanner() 方法，  
	    * 以实现在没有指定配置类的时候，能手动扫描包  
	    * 扫描器用处不大，仅仅是在外部手动调用 .scan() 方法时使用，常规方法不会用到这个 Scanner 对象的  
    */  
	   this.scanner = new ClassPathBeanDefinitionScanner(this);  
	}  
	```
	
	在创建 `AnnotatedBeanDefinitionReader`（【注解版】bean 定义信息读取器）对象的构造函数中，与方式一一样，也调用 `AnnotationConfigUtils` 工具类中的 `registerAnnotationConfigProcessors()` 方法 **往 Spring 容器中注册一些与注解有关的后置处理器的 bean 定义信息**。
	
	```java
	public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry) {
	    this(registry, getOrCreateEnvironment(registry));
	}
	
	public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry, Environment environment) {  
       Assert.notNull(registry, "BeanDefinitionRegistry must not be null");  
       Assert.notNull(environment, "Environment must not be null");  
       /**  
        * 初始化成员变量 registry  
        */   
       this.registry = registry;  
       /**  
        * 用户处理条件注解 @Conditional  
        */   
       this.conditionEvaluator = new ConditionEvaluator(registry, environment, null);  
       /**  
        * 注册一些和注解相关的后置处理器的 BeanDefinition  
        * 配置类后置处理器、自动装配功能后置处理器、JSR-250 注解支持的后置处理器、JPA 功能支持的后置处理器、  
        * 事件方法功能的后置处理器、事件工厂功能的后置处理器的定义信息  
     */  
	    AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry);  
	}
	```

以上就是两种注册 `ConfigurationClassPostProcessor` 后置处理器的时机。

```php
<?php
/**
 * Git webhooks 自动部署脚本
 * 地址：https://github.com/fuzhengwei/guide-webhooks/settings/hooks
 */

// 接收post参数
$requestBody = file_get_contents("php://input");
if (empty($requestBody)) {
    exit('data null！');
}

// Content type = application/json
$content = json_decode($requestBody, true);

// 验证 Webhooks 配置的 Secret，也可以不验证
/*if (empty($content['password']) || $content['password'] != '123456') {
	exit('password error');
}*/

// 项目存放物理路径，也就是站点的访问地址
$path = "/www/wwwroot/blog.xiaorang.fun/CodeGuide/";

// 判断需要下拉的分支上是否有提交，我们这里的分支名称为 main
if ($content['ref'] == 'refs/heads/main') {

    // 执行脚本 git pull，拉取分支最新代码
    $res = shell_exec("cd {$path} && git pull origin main 2>&1 && yarn install && yarn docs:build && mv docs/.vuepress/dist/* /www/wwwroot/blog.xiaorang.fun/"); // 当前为www用户

    // 记录日志 ($content 返回的是一整个对象，可以按需获取里面的内容，写入日志)
    $res_log = '------------------------->' . PHP_EOL;
    $res_log .= '用户 ' . $content['pusher']['name'] . ' 于 ' . date('Y-m-d H:i:s') . ' 向项目【' . $content['repository']['name'] . '】分支【' . $content['ref'] . '】PUSH ' . $content['commits'][0]['message'] . PHP_EOL;
    $res_log .= $res . PHP_EOL;

    // 追加方式，写入日志文件
    file_put_contents("git_webhook_log.txt", $res_log, FILE_APPEND);
}
echo 'done';

```

