---
title: Spring注册Bean的几种方式
tags:
  - spring
  - 源码
created: 2022-09-24 14:47:10
modified: 2022-09-24 14:56:53
number headings: auto, first-level 1, max 6, _.1.1.
---

# Spring注册Bean的几种方式

## 1. 环境搭建

利用 [Spring 源码环境搭建](../Spring源码环境搭建/README.md) 这篇文章中搭建好的 Spring 源码环境，总结一下往 Spring 中注册 Bean 到底有几种方式。

### 1.1. 创建 spring-import-bean-study 模块

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/Pasted%20image%2020221024052559.png)

### 1.2. 引入相关依赖

在模块的 `build.gradle` 文件中引入以下依赖：

```gradle
dependencies {  
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.9.0'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.9.0'
    testImplementation(project(':spring-test'))
    implementation(project(':spring-context'))
    implementation 'org.slf4j:slf4j-api:2.0.3'
    implementation 'ch.qos.logback:logback-classic:1.4.3'
}
```

### 1.3. 日志配置文件

由于引入了 `logback`，所以需要在资源目录 `resources` 下创建一个 `logback.xml` 配置文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5p %c{1}:%L - %m%n</pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5p %c{1}:%L - %m%n</pattern>
            <charset>utf-8</charset>
        </encoder>
        <file>log/output.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.FixedWindowRollingPolicy">
            <fileNamePattern>log/output.log.%i</fileNamePattern>
        </rollingPolicy>
        <triggeringPolicy class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy">
            <MaxFileSize>1MB</MaxFileSize>
        </triggeringPolicy>
    </appender>

    <root level="DEBUG">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

### 1.4. Spring 核心配置文件

在资源目录 `resources` 下创建一个 Spring 的核心配置文件 `applicationContext.xml` 。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/Pasted%20image%2020221024053130.png)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xmlns="http://www.springframework.org/schema/beans"
	   xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
</beans>
```

## 2. Spring 中注册 Bean 的方式

> 温馨提示：对于本篇中的某些知识点不清楚的小伙伴可以先查看基础篇中的文章。

### 2.1. XML 配置文件方式

面向 Spring 开发已经逐渐从繁琐的 XML 配置文件发展到简单好用的注解驱动模式，尤其是在 Springboot 这样一款快速开发脚手架中，底层大量使用注解来完成各种各样的高级功能。

🤔：咱们为什么还要介绍这种方式呢？

🤓：咱们是学习，只有知道使用 XML 配置文件方式注册 Bean 时有多痛苦，才能深刻体会使用注解方式注册 Bean 时有多爽！（也就只有读源码才知道 Spring 到底有多牛，帮咱们做了多少事情）。

编写一个实体类 `Student`。

```java
public class Student {
	private String name;
	private Integer age;

	public Student() {
	}

	public Student(String name, Integer age) {
		this.name = name;
		this.age = age;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Integer getAge() {
		return age;
	}

	public void setAge(Integer age) {
		this.age = age;
	}

	@Override
	public String toString() {
		return "Student{" +
				"name='" + name + '\'' +
				", age=" + age +
				'}';
	}
}
```

XML 配置文件中配置如下：使用 `bean` 标签往 Spring 容器中注册一个 `Student` 的单实例 `Bean`，使用 `property` 标签给这个 `Bean` 对象的 `name` 和 `age` 属性赋值。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xmlns="http://www.springframework.org/schema/beans"
	   xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
	<bean class="top.xiaorang.importbean.entity.Student">
		<property name="name" value="xiaorang"/>
		<property name="age" value="18"/>
	</bean>
</beans>
```

创建 `SpringImportBeanByXmlTests` 测试类，增加测试方法 `testXml()`，看看能否从 Spring 容器中获取 `Student` 组件，从而验证使用 XML 配置文件这种方式是否可以往 Spring 中注册 `Bean`。

```java
@ContextConfiguration(locations = "classpath:applicationContext.xml")
@ExtendWith(SpringExtension.class)
public class SpringImportBeanByXmlTests {
	private static final Logger LOGGER = LoggerFactory.getLogger(SpringImportBeanByXmlTests.class);

	@Test
	public void testXml(ApplicationContext applicationContext) {
		Student student = applicationContext.getBean(Student.class);
		LOGGER.info(student.toString());
	}
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过 XML 配置文件方式注册的 `Bean`。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/Pasted%20image%2020221025010000.png)

### 2.2. @Configuration + @Bean

在上面已经简单演示如何通过 XML 配置文件的方式将 `JavaBean` 对象注册到 Spring 容器中。那么使用注解的方式又该如何实现呢？使用注解的方式比使用 XML 配置文件的方式要简单的多，首先创建一个类，并 **在该类上添加 `@Configuration` 注解用来标识该类是 Spring 中的一个配置类**，最后 **通过在该类中的某个方法上添加 `@Bean` 注解标识将该方法的返回值对象注册到 Spring 容器中**。这种方式适用于将第三方类库中的类注册到 Spring 容器中。

编写配置类：在 `MainConfig` 类上添加 `@Configuration` 注解，在 `student()` 方法上添加 `@Bean` 注解，方法返回创建的 `Student` 组件。

```java
@Configuration
public class MainConfig {
	@Bean
	public Student student() {
		return new Student("xiaobai", 27);
	}
}
```

创建 `SpringImportBeanByAnnotationTests` 测试类，增加测试方法 `testConfigurationWithBeanMethod()`，看看能否从 Spring 容器中获取 `Student` 组件，从而验证使用 `@Configuration` 注解搭配 `@Bean` 注解这种方式是否可以往 Spring 中注册 `Bean`。

```java
@ContextConfiguration(classes = {MainConfig.class})
@ExtendWith(SpringExtension.class)
public class SpringImportBeanByAnnotationTests {
	private static final Logger LOGGER = LoggerFactory.getLogger(SpringImportBeanByAnnotationTests.class);

	@Test
	public void testConfigurationWithBeanMethod(ApplicationContext applicationContext) {
		Student student = applicationContext.getBean(Student.class);
		LOGGER.info(student.toString());
	}
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过 `@Configuration` 注解搭配 `@Bean` 注解方式注册的 `Bean`。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/Pasted%20image%2020221025010342.png)

### 2.3. @Component + @ComponentScan

在实际项目开发中，更多的是使用 Spring 的包扫描功能对项目中的包进行扫描，凡是在指定的包及其子包中标注了 `@Repository`、`@Service`、`@Controller` 和 `@Component` 注解的类都会被扫描到，然后注册到 Spring 容器中。

🤔：为什么是扫描标注了 `@Repository`、`@Service`、`@Controller` 和 `@Component` 注解的类？

🤓：在 `@ComponentScan` 注解的定义中 `useDefaultFilters` 属性已经指出会自动扫描标注 `@Repository`、`@Service`、`@Controller` 和 `@Component` 注解的类。其实去查看 `@Repository`、`@Service`、`@Controller` 注解的定义就可以发现，其实这三个注解本质上还是 `@Component` 注解。

![|1081](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/Pasted%20image%2020221025011013.png)

编写三个分别使用 `@Repository`、`@Service`、`@Controller` 注解标注的类。

可以看到在 `OrderController` 类中需要从 Spring 容器中获取一个 `OrderService` 类的组件，而 `OrderService` 类需要从 Spring 容器获取一个 `OrderRepository` 类的组件。

```java
@Controller
public class OrderController {
	private final OrderService orderService;

	public OrderController(OrderService orderService) {
		this.orderService = orderService;
	}

	@Override
	public String toString() {
		return "OrderController{" +
				"orderService=" + orderService +
				'}';
	}
}
```

```java
@Service
public class OrderService {
	private final OrderRepository orderRepository;

	public OrderService(OrderRepository orderRepository) {
		this.orderRepository = orderRepository;
	}

	@Override
	public String toString() {
		return "OrderService{" +
				"orderRepository=" + orderRepository +
				'}';
	}
}
```

```java
@Repository
public class OrderRepository {

}
```

修改配置类 `MainConfig`，在类上增加 `@ComponentScan` 注解。

```java
@Configuration
@ComponentScan("top.xiaorang.importbean")
public class MainConfig {
	@Bean
	public Student student() {
		return new Student("xiaobai", 27);
	}
}
```

修改 `SpringImportBeanByAnnotationTests` 测试类，增加测试方法 `testConfigurationWithBeanMethod()`，看看能否从 Spring 容器中获取 `OrderController` 组件，从而验证通过 `@ComponentScan` 注解搭配 `@Component` 注解这种方式是否可以往 Spring 中注册 `Bean`。

```java
@Test
public void testComponentScanWithComponent(ApplicationContext applicationContext) {
    OrderController orderController = applicationContext.getBean(OrderController.class);
    LOGGER.info(orderController.toString());
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过 `@ComponentScan` 注解搭配 `@Component` 注解方式注册的 `Bean`。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/Pasted%20image%2020221025012958.png)

### 2.4. 实现 FactoryBean 接口

这种方式在日常开发中不常见，但是在一些框架整合上用的比较多，比如在 `Spring` 与 `Mybatis` 整合中的 `MapperFactoryBean`、`SqlSessionFactoryBean`。

编写实体类 `User`：

```java
public class User {
	private String username;
	private String password;

	public User() {
	}

	public User(String username, String password) {
		this.username = username;
		this.password = password;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	@Override
	public String toString() {
		return "User{" +
				"username='" + username + '\'' +
				", password='" + password + '\'' +
				'}';
	}
}
```

编写工厂类 `UserFactoryBean`：

```java
@Component
public class UserFactoryBean implements FactoryBean<User> {
	@Override
	public User getObject() throws Exception {
		return new User("sanshi", "123456");
	}

	@Override
	public Class<?> getObjectType() {
		return User.class;
	}
}
```

修改 `SpringImportBeanByAnnotationTests` 测试类，增加测试方法 `testFactoryBean()`，看看能否从 Spring 容器中获取 `User` 组件，从而验证通过实现 `FactoryBean` 接口这种方式是否可以往 Spring 中注册 `Bean`。

```java
@Test
public void testFactoryBean(ApplicationContext applicationContext) {
    User user = applicationContext.getBean(User.class);
    LOGGER.info(user.toString());
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过实现 `FactoryBean` 接口方式注册的 `Bean`。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/Pasted%20image%2020221025014933.png)

### 2.5. @Import

在项目开发中，自己写的类可以通过包扫描（`@ComponentScan` 注解搭配 `@Component` 注解）的方式将 `Bean` 对象注册到 Spring 容器中，但是这种方式比较有局限性，只能在自己写的类上标注 `@Component` 注解。如果不是自己的类，如引入的一些第三方类库中的类，那么如何将这样的类注册到 Spring 容器中呢？除了前面提到过的一种解决方法 `@Cofinguration` 注解搭配 `@Bean` 注解之外，现在介绍另外一种方法：使用 `@Import` 注解快速向 Spring 容器中导入一个组件。

```java
@Target(ElementType.TYPE)  
@Retention(RetentionPolicy.RUNTIME)  
@Documented  
public @interface Import {  
   /**  
    * {@link Configuration @Configuration}, {@link ImportSelector},  
    * {@link ImportBeanDefinitionRegistrar}, or regular component classes to import.  
    */   
    Class<?>[] value();  
}
```

#### 2.5.1. 简单的类

```java
public class Color {

}
```

修改配置类 `MainConfig`，在类上增加 `@Import` 注解，向容器中导入一个 `Color` 组件。

```java
@Configuration
@ComponentScan("top.xiaorang.importbean")
@Import({Color.class})
public class MainConfig {
	@Bean
	public Student student() {
		return new Student("xiaobai", 27);
	}
}
```

修改 `SpringImportBeanByAnnotationTests` 测试类，增加测试方法 `testImportSimpleClass()`，看看能否从 Spring 容器中获取 `Color` 组件，从而验证通过 `@Import` 注解 + 简单的类这种方式是否可以往 Spring 中注册 `Bean`。

```java
@Test
public void testImportSimpleClass(ApplicationContext applicationContext) {
    Color color = applicationContext.getBean(Color.class);
    LOGGER.info(color.toString());
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过 `@Import` 注解 + 简单的类方式注册的 `Bean`。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211021631902.png)

#### 2.5.2. ImportSelector 接口实现类

`ImportSelector` 接口是 Spring 中导入外部配置的核心接口。现在来看看 `ImportSelector` 接口的源码：

```java
public interface ImportSelector {  
  
   /**  
    * Select and return the names of which class(es) should be imported based on    
    * the {@link AnnotationMetadata} of the importing @{@link Configuration} class.  
    * @return the class names, or an empty array if none  
    */   
	String[] selectImports(AnnotationMetadata importingClassMetadata);  
  
   /**  
    * Return a predicate for excluding classes from the import candidates, to be    
    * transitively applied to all classes found through this selector's imports.    
    * <p>If this predicate returns {@code true} for a given fully-qualified  
    * class name, said class will not be considered as an imported configuration    
    * class, bypassing class file loading as well as metadata introspection.    
    * @return the filter predicate for fully-qualified candidate class names  
    * of transitively imported configuration classes, or {@code null} if none  
    * @since 5.2.4  
    */   
	@Nullable  
	default Predicate<String> getExclusionFilter() {  
		return null;  
	}  
}
```

`ImportSelector` 接口主要作用是收集需要导入的配置类，其中的 `selectImports()` 方法的返回值就是 **需要向 Spring 容器中导入的类的<u>完全限定名</u>**。如果该接口的实现类同时实现 `EnvironmentAware`、`BeanFactoryAware`、`BeanClassLoaderAware` 和 `ResourceLoaderAware` 接口，那么在调用其 `selectImports()` 方法之前会先调用上述接口中对应的方法，如果需要在所有的 `@Configuration` 类处理完再导入，那么可以实现 `DeferredImportSelector` 接口。  
在 `selectImports()` 方法中，存在一个 `AnnotationMetadata` 类型的参数，这个参数能够获取到当前标注 `@Import` 注解的类的所有注解信息，也就说不仅能获取到 `@Import` 注解里面的信息，还能获取到类上其他注解的信息。

现在咱们自定义一个 `ImportSelector` 接口的实现类 `MyImportSelector`，向容器中导入 `Yellow` 和 `Blue` 两个组件。

```java
public class Yellow {
	
}

public class Blue {

}

public class MyImportSelector implements ImportSelector {
    @Override
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {
        return new String[]{"top.xiaorang.importbean.entity.Yellow", "top.xiaorang.importbean.entity.Blue"};
    }
}
```

修改配置类 `MainConfig`，在类上标注的 `@Import` 注解的 `value` 属性中增加自定义的 `ImportSelector` 接口实现类 `MyImportSelector`。

```java
@Configuration
@ComponentScan("top.xiaorang.importbean")
@Import({Color.class, MyImportSelector.class})
public class MainConfig {
	@Bean
	public Student student() {
		return new Student("xiaobai", 27);
	}
}
```

修改 `SpringImportBeanByAnnotationTests` 测试类，增加测试方法 `testImportSelector()`，看看能否从 Spring 容器中获取 `Yellow` 和 `Blue` 两个 组件，从而验证通过 `@Import` 注解 + `ImportSelector` 接口实现类这种方式是否可以往 Spring 中注册 `Bean`。

```java
@Test
public void testImportSelector(ApplicationContext applicationContext) {
    Yellow yellow = applicationContext.getBean(Yellow.class);
    LOGGER.info(yellow.toString());
    Blue blue = applicationContext.getBean(Blue.class);
    LOGGER.info(blue.toString());
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过 `@Import` 注解 + `ImportSelector` 接口实现类方式注册的 `Bean`。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211021705795.png)

#### 2.5.3. ImportBeanDefinitionRegistrar 接口实现类

```java
public interface ImportBeanDefinitionRegistrar {

	/**
	 * Register bean definitions as necessary based on the given annotation metadata of
	 * the importing {@code @Configuration} class.
	 * <p>Note that {@link BeanDefinitionRegistryPostProcessor} types may <em>not</em> be
	 * registered here, due to lifecycle constraints related to {@code @Configuration}
	 * class processing.
	 * <p>The default implementation delegates to
	 * {@link #registerBeanDefinitions(AnnotationMetadata, BeanDefinitionRegistry)}.
	 * @param importingClassMetadata annotation metadata of the importing class
	 * @param registry current bean definition registry
	 * @param importBeanNameGenerator the bean name generator strategy for imported beans:
	 * {@link ConfigurationClassPostProcessor#IMPORT_BEAN_NAME_GENERATOR} by default, or a
	 * user-provided one if {@link ConfigurationClassPostProcessor#setBeanNameGenerator}
	 * has been set. In the latter case, the passed-in strategy will be the same used for
	 * component scanning in the containing application context (otherwise, the default
	 * component-scan naming strategy is {@link AnnotationBeanNameGenerator#INSTANCE}).
	 * @since 5.2
	 * @see ConfigurationClassPostProcessor#IMPORT_BEAN_NAME_GENERATOR
	 * @see ConfigurationClassPostProcessor#setBeanNameGenerator
	 */
	default void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry,
			BeanNameGenerator importBeanNameGenerator) {

		registerBeanDefinitions(importingClassMetadata, registry);
	}

	/**
	 * Register bean definitions as necessary based on the given annotation metadata of
	 * the importing {@code @Configuration} class.
	 * <p>Note that {@link BeanDefinitionRegistryPostProcessor} types may <em>not</em> be
	 * registered here, due to lifecycle constraints related to {@code @Configuration}
	 * class processing.
	 * <p>The default implementation is empty.
	 * @param importingClassMetadata annotation metadata of the importing class
	 * @param registry current bean definition registry
	 */
	default void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
	}
}
```

由源码可以看出，在 `ImportBeanDefinitionRegistrar` 接口中有一个 `registerBeanDefinitions()` 方法，通过该方法可以向 Spring 容器注册 bean 的定义信息，后续在实例化所有非懒加载的单实例 bean 阶段根据 bean 的定义信息去创建 bean 的实例对象。所有实现了 `ImportBeanDefinitionRegistrar` 接口的类都会被 `ConfigurationClassPostProcessor` 后置处理器处理，`ConfigurationClassPostProcessor` 实现了 `BeanFactoryPostProcessor` 接口，`ConfigurationClassPostProcessor` 后置处理器非常重要！！！在这篇 [Spring-ConfigurationClassPostProcessor后置处理器详解](../Spring-ConfigurationClassPostProcessor后置处理器详解/README.md) 源码分析文章中对其进行了详细地剖析，这里就不再赘述。

现在咱们自定义一个 `ImportBeanDefinitionRegistrar` 接口的实现类 `MyImportBeanDefinitionRegistrar`，向容器中导入 `Rainbow` 组件。

```java
public class Rainbow {
	
}

public class MyImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {
	@Override
	public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry, BeanNameGenerator importBeanNameGenerator) {
		RootBeanDefinition rootBeanDefinition = new RootBeanDefinition();
		rootBeanDefinition.setBeanClass(Rainbow.class);
		registry.registerBeanDefinition("rainbow", rootBeanDefinition);
	}
}
```

修改配置类 `MainConfig`，在类上标注的 `@Import` 注解的 `value` 属性中增加自定义的 `ImportBeanDefinitionRegistrar` 接口实现类 `MyImportBeanDefinitionRegistrar`。

```java
@Configuration
@ComponentScan("top.xiaorang.importbean")
@Import({Color.class, MyImportSelector.class, MyImportBeanDefinitionRegistrar.class})
public class MainConfig {
	@Bean
	public Student student() {
		return new Student("xiaobai", 27);
	}
}
```

修改 `SpringImportBeanByAnnotationTests` 测试类，增加测试方法 `testImportBeanDefinitionRegistrar()`，看看能否从 Spring 容器中获取 `Rainbow` 组件，从而验证通过 `@Import` 注解 + `ImportBeanDefinitionRegistrar` 接口实现类这种方式是否可以往 Spring 中注册 `Bean`。

```java
@Test
public void testImportBeanDefinitionRegistrar(ApplicationContext applicationContext) {
    Rainbow rainbow = applicationContext.getBean(Rainbow.class);
    LOGGER.info(rainbow.toString());
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过 `@Import` 注解 + `ImportBeanDefinitionRegistrar` 接口实现类方式注册的 `Bean`。

![image-20221102174735763](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211021747831.png)

### 2.6. 实现 BeanDefinitionRegistryPostProcessor 后置处理器接口

这种方式在日常开发中并不常见，但是在 Spring 的底层源码中却很常见，其中 `ConfigurationClassPostProcessor` 后置处理器就实现了该接口，该后置处理器用于解析 `@Component`、`@Configuration`、`@ComponentScan`、`@Import` 等注解，用于向容器中注册 bean 的定义信息。

现在咱们自定义一个 `BeanDefinitionRegistryPostProcessor ` 接口的实现类 `MyBeanDefinitionRegistryPostProcessor `，向容器中导入 `Cat` 组件。

```java
public class Cat {

}

@Component
public class MyBeanDefinitionRegistryPostProcessor implements BeanDefinitionRegistryPostProcessor {
	@Override
	public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException {
		RootBeanDefinition rootBeanDefinition = new RootBeanDefinition();
		rootBeanDefinition.setBeanClass(Cat.class);
		registry.registerBeanDefinition("cat", rootBeanDefinition);
	}

	@Override
	public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {

	}
}
```

需要注意的是，要将 `MyBeanDefinitionRegistryPostProcessor` 后置处理器标注 `@Component` 注解，即将 `MyBeanDefinitionRegistryPostProcessor` 后置处理器注册到 Spring 容器中，这样 `MyBeanDefinitionRegistryPostProcessor` 后置处理器的注册功能才能生效。

修改 `SpringImportBeanByAnnotationTests` 测试类，增加测试方法 `testBeanDefinitionRegistryPostProcessor()`，看看能否从 Spring 容器中获取 `Cat` 组件，从而验证通过实现 `BeanDefinitionRegistryPostProcessor` 后置处理器接口这种方式是否可以往 Spring 中注册 `Bean`。

```java
@Test
public void testBeanDefinitionRegistryPostProcessor(ApplicationContext applicationContext) {
    Cat cat = applicationContext.getBean(Cat.class);
    LOGGER.info(cat.toString());
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过实现 `BeanDefinitionRegistryPostProcessor` 后置处理器接口方式注册的 `Bean`。

![image-20221102180411929](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211021804998.png)

### 2.7. 实现 BeanFactoryPostProcessor 后置处理器接口

该后置处理器接口 `BeanFactoryPostProcessor` 其实是上一种方式中 `BeanDefinitionRegistryPostProcessor` 后置处理器接口的父类，也可以用来向容器中注册 bean 的定义信息。

现在咱们自定义一个 `BeanFactoryPostProcessor` 接口的实现类 `MyBeanFactoryPostProcessor `，向容器中导入 `Game` 组件。

```java
public class Game {

}

@Component
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
	@Override
	public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
		if (beanFactory instanceof BeanDefinitionRegistry) {
			BeanDefinitionRegistry beanDefinitionRegistry = (BeanDefinitionRegistry) beanFactory;
			RootBeanDefinition rootBeanDefinition = new RootBeanDefinition();
			rootBeanDefinition.setBeanClass(Game.class);
			beanDefinitionRegistry.registerBeanDefinition("game", rootBeanDefinition);
		}
	}
}
```

修改 `SpringImportBeanByAnnotationTests` 测试类，增加测试方法 `testBeanFactoryPostProcessor()`，看看能否从 Spring 容器中获取 `Game` 组件，从而验证通过实现 `BeanFactoryPostProcessor` 后置处理器接口这种方式是否可以往 Spring 中注册 `Bean`。

```java
@Test
public void testBeanFactoryPostProcessor(ApplicationContext applicationContext) {
    Game game = applicationContext.getBean(Game.class);
    LOGGER.info(game.toString());
}
```

测试结果如下所示：可以看到可以从 Spring 容器中成功获取到通过实现 `BeanFactoryPostProcessor` 后置处理器接口方式注册的 `Bean`。

![image-20221102181334654](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211021813713.png)

至此，向 Spring 注册 Bean 的几种方式就已经成功演示完成，可能还有其他的方式可以向 Spring 容器中注册 Bean，这就需要小伙伴自己去摸索总结了！🎉🎉🎉