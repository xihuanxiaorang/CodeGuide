---
title: Spring注解驱动开发
tags:
  - spring
  - 注解
created: 2022-08-27 01:31:25
modified: 2022-09-17 13:37:46
number headings: auto, first-level 1, max 6, _.1.1.
---

# Spring注解驱动开发

## 1. 楔子

> 本章节所涉及到的代码在 [GitHub - xihuanxiaorang/spring-study: 用于spring学习](https://github.com/xihuanxiaorang/spring-study) 仓库中的 `annotation` 模块，可以自行查看。 

面向 Spring 开发已经逐渐从繁琐的 XML 配置文件发展到简单好用的注解驱动模式，尤其是在 Springboot 这样一款快速开发脚手架中，底层大量使用注解完成各种各样的高级功能，所以说非常有必要整理下 Spring 提供的常用注解。便于记忆，将其分为四个部分：**组件注册**、**生命周期**、**属性赋值** 和 **自动装配**。  

## 2. 组件注册

### 2.1. @Configuration&@Bean 注解

先来回顾一下使用 XML 配置文件的方式来创建和管理 bean 对象。先来创建一个类：

```java
public class Person {  
    private String name;  
    private Integer age;  
  
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
        return "Person{" + "name='" + name + '\'' + ", age='" + age + '\'' + '}';  
    }  
}
```

然后再创建一个 Spring 的核心配置文件 `applicationContext.xml`：

```xml
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  
       xmlns="http://www.springframework.org/schema/beans"  
       xsi:schemaLocation="http://www.springframework.org/schema/beans  
       http://www.springframework.org/schema/beans/spring-beans.xsd">  
    <bean id="person" class="top.xiaorang.spring.annotation.bean.Person">  
        <property name="name" value="xiaorang"/>  
        <property name="age" value="12"/>  
    </bean>  
</beans>
```

创建测试类：

```java
public class SpringXmlConfigurationTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringXmlConfigurationTest.class);  
  
    @Test  
    public void test() {  
        ApplicationContext applicationContext = new ClassPathXmlApplicationContext("classpath:applicationContext.xml");  
        String[] beanDefinitionNames = applicationContext.getBeanDefinitionNames();  
        for (String beanDefinitionName : beanDefinitionNames) {  
            LOGGER.info(beanDefinitionName);  
        }  
    }  
}
```

测试结果如下所示:  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126932.png)  

在上面已经简单演示如何通过 XML 配置文件的方式将 JavaBean 对象注册到 Spring 容器中。那么使用注解的方式又该如何实现呢？使用注解的方式比使用 XML 配置文件的方式要简单的多，首先创建一个类，并 **在该类上添加 `@Configuration` 注解用来标识该类是 Spring 中的一个配置类**，最后 **通过在该类中的某个方法上添加 `@Bean` 注解标识将该方法的返回值对象注册到 Spring 容器中**。  

```java
@Configuration  
public class MainConfig {  
    @Bean  
    public Person person() {  
        return new Person("小让", 27);  
    }  
}
```

```java
public class SpringAnnotationConfigurationTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationTest.class);  
  
    @Test  
    public void test() {  
        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfig.class);  
        String[] beanDefinitionNames = applicationContext.getBeanDefinitionNames();  
        for (String beanDefinitionName : beanDefinitionNames) {  
            LOGGER.info(beanDefinitionName);  
        }  
    }  
}
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126575.png)

从上面的代码可以看出，使用注解驱动方式开发之后，就不再需要 XML 配置文件。只需将配置文件 => 配置类 (`@Configuration`)，`<bean id="" class="" />` 标签 => `@Bean` 注解，容器对象从 `ClassPathXmlApplicationContext` => `AnnotationConfigApplicationContext` 。  
**结论**：`@Configuration` 注解搭配 `@Bean` 注解可以代替 XML 配置文件完成对象的创建和管理。

#### 2.1.1. 细节分析 1：@Configuration 注解

```java
@Target(ElementType.TYPE)  
@Retention(RetentionPolicy.RUNTIME)  
@Documented  
@Component  
public @interface Configuration {  
   String value() default "";
   boolean proxyBeanMethods() default true;
}
```

表明当前类是 Spring 中的一个配置类，作用是 **代替 Spring 中的核心配置文件 `applicationContext.xml`** 。但其 **本质就是 `@Component` 注解**，所以说被此注解修饰的类，同样会被注册到 Spring 容器中。

#### 2.1.2. 细节分析 2：@Bean 注解

```java
@Target({ElementType.METHOD, ElementType.ANNOTATION_TYPE})  
@Retention(RetentionPolicy.RUNTIME)  
@Documented  
public @interface Bean {
	// 用于指定注册到 Spring 容器中 bean 的标识 (id)。支持指定多个标识，当不指定该属性时，默认值为当前方法名。
	@AliasFor("name")  
	String[] value() default {};
	
	@AliasFor("value")  
	String[] name() default {};
	
	// 用于指定是否支持自动按类型注入到其他 bean 中。只影响 `@Autowired` 注解使用，不会影响 `@Resource` 注解。默认值为 true。
	boolean autowireCandidate() default true; // 

	// 用于指定 bean 中哪个方法作为初始化方法
	String initMethod() default "";

	// 用于指定 bean 中哪个方法作为销毁方法
	String destroyMethod() default AbstractBeanDefinition.INFER_METHOD;
}
```

**`@Bean` 注解添加在方法上**，**用于给 Spring 容器中注册 bean 实例**。其中，**bean 的类型为方法的返回值类型**，**bean 的 id 默认为方法名**，可以通过注解中的 name 或者 value 属性修改 bean 的 id。  
💡需要注意的是：**被 `@Bean` 注解标注的方法中的参数都是从 Spring 容器中获取的**！

### 2.2. @ComponentScan 注解

在实际项目开发中，更多的是使用 Spring 的包扫描功能对项目中的包进行扫描，凡是在指定的包及其子包中标注了 `@Repository`、`@Service`、`@Controller` 和 `@Component` 注解的类都会被扫描到，然后注册到 Spring 容器中。  

先来回顾一下如何 XML 配置文件中配置包扫描。创建三个分别使用 `@Repository`、`@Service`、`@Controller` 注解标注的类：  

```java
@Repository  
public class BookRepository {

}

@Service  
public class BookService {

}

@Controller  
public class BookController {

}
```

然后在 Spring 核心配置文件 `applicationContext.xml` 增加包扫描标签 `<context:component-scan base-package=""/>`。

```xml
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  
       xmlns:context="http://www.springframework.org/schema/context" 
       xmlns="http://www.springframework.org/schema/beans"  
       xsi:schemaLocation="http://www.springframework.org/schema/beans  
       http://www.springframework.org/schema/beans/spring-beans.xsd 
       http://www.springframework.org/schema/context 
       https://www.springframework.org/schema/context/spring-context.xsd">  
    <context:component-scan base-package="top.xiaorang.spring.annotation"/>  
    <bean id="person" class="top.xiaorang.spring.annotation.bean.Person">  
        <property name="name" value="xiaorang"/>  
        <property name="age" value="12"/>  
    </bean>  
</beans>
```

运行 `SpringXmlConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示: 只要是在 `top.xiaorang.spring.annotation` 包及其子包下标注了 `@Repository`、`@Service`、`@Controller` 和 `@Component` 注解的类都被扫描到，然后注册到 Spring 容器中。  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126378.png)  

现在开始使用 `@ComponentScan` 注解来配置包扫描。非常简单，只需要在配置类 `MainConfig` 上加上 `@ComponentScan` 注解，然后指定要扫描的包路径即可。具体实现过程如下：

```java
@Configuration  
@ComponentScan("top.xiaorang.spring.annotation")  
public class MainConfig {  
    @Bean  
    public Person person() {  
        return new Person("小让", 27);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126423.png)

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Repeatable(ComponentScans.class)
public @interface ComponentScan {
	/**
		用于指定要扫描的包。当指定了包的名称之后，spring会扫描指定的包及其子包下的所有类。
	 */
	@AliasFor("basePackages")
	String[] value() default {};

  	/**
  	它和value作用是一样的。
	 */
	@AliasFor("value")
	String[] basePackages() default {};

  	/**
	  	指定具体要扫描的类的字节码。
	 */
	Class<?>[] basePackageClasses() default {};

  	/**
	  	指定扫描bean对象存入容器时的命名规则。
	 */
	Class<? extends BeanNameGenerator> nameGenerator() default BeanNameGenerator.class;

  	/**
	 */
	Class<? extends ScopeMetadataResolver> scopeResolver() default AnnotationScopeMetadataResolver.class;

  	/**
	 */
	ScopedProxyMode scopedProxy() default ScopedProxyMode.DEFAULT;

  	/**
	 */
	String resourcePattern() default ClassPathScanningCandidateComponentProvider.DEFAULT_RESOURCE_PATTERN;

  	/**
	  	是否对带有@Component @Repository @Service @Controller注解的类开启检测,默认是开启的。
	 */
	boolean useDefaultFilters() default true;

  	/**
	  	自定义组件扫描的过滤规则，用以扫描组件。
			FilterType有5种类型：
	            ANNOTATION, 注解类型 默认
	            ASSIGNABLE_TYPE,指定固定类
	            ASPECTJ， ASPECTJ类型
	            REGEX,正则表达式
	            CUSTOM,自定义类型
	 */
	Filter[] includeFilters() default {};

  	/**
	  	自定义组件扫描的排除规则。
	 */
	Filter[] excludeFilters() default {};

  	/**
	  	组件扫描时是否采用懒加载 ，默认不开启。
	 */
	boolean lazyInit() default false;
	
	@Retention(RetentionPolicy.RUNTIME)
		@Target({})
		@interface Filter {
			/**
			 */
			FilterType type() default FilterType.ANNOTATION;
	
			/**
			 */
			@AliasFor("classes")
			Class<?>[] value() default {};
	      
			/**
			 */
			@AliasFor("value")
			Class<?>[] classes() default {};
	      
			/**
			 */
			String[] pattern() default {};
		}
	}
```

着重来分析下 `@ComponentScan` 注解中的 `includeFilters` 和 `excludeFilters` 两个属性。其中， `includeFilters` 属性用于指定包扫描时按照什么过滤规则去注册组件；而 `excludeFilters` 属性用于指定包扫描时按照什么过滤规则去排除组件。

#### 2.2.1. 细节分析 1：按照过滤规则注册组件

在 `MainConfig` 配置类标注的 `@ComponentScan` 注解中配置 `includeFilters` 属性：让其只扫描被 `@Controller` 注解标注的类和 `BookService` 类，这样做的话，理论上，`BookRepository` 类不会被注册到 Spring 容器中。  
配置类：

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookService.class}),  
})  
public class MainConfig {  
    @Bean  
    public Person person() {  
        return new Person("小让", 27);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126225.png)  
发现 `BookRepository` 还是自动注册到 Spring 容器中，为什么猜想不对呢？其实，在分析 `@ComponentScan` 注解源码的时候，其中有一个属性，`useDefaultFilters` ，是否对带有 `@Repository`、`@Service`、`@Controller` 和 `@Component` 注解的类开启检测，默认是开启的。要想 `includeFilters` 属性达到预期效果，就需要将 `useDefaultFilters` 属性置为 false。

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookService.class}),  
}, useDefaultFilters = false)  
public class MainConfig {  
    @Bean  
    public Person person() {  
        return new Person("小让", 27);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  发现只有 `BookController` 和 `BookService` 被扫描到 Spring 容器中，相当于间接将 `BookRepository` 被排除在外。  
![](attachments/Pasted%20image%2020220828040106.png)

#### 2.2.2. 细节分析 2：按照过滤规则排除组件

在 `MainConfig` 配置类标注的 `@ComponentScan` 注解中配置 `excludeFilters` 属性：不扫描被 `@Service` 注解标注的类，这样做的话，理论上，现在就只剩下 `BookController` 类会被注册到 Spring 容器中。  

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookService.class}),  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
public class MainConfig {  
    @Bean  
    public Person person() {  
        return new Person("小让", 27);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126422.png)

#### 2.2.3. 细节分析 3：自定义过滤规则

组件扫描的过滤规则有 5 种，位于 FilterType 枚举类中。  

- ANNOTATION，注解类型 默认  
- ASSIGNABLE_TYPE，指定固定类  
- ASPECTJ，ASPECTJ 表达式 
- REGEX，正则表达式  
- CUSTOM，自定义类型  
前面四种过滤规则都实现了 `TypeFilter` 接口，并且都有默认的实现类。如果想要自定义过滤规则的话，也需要实现 `TypeFilter` 接口。  
需求：将标注了自定义注解 `@MyComponent` 的类也扫描到 Spring 容器中。  

##### 2.2.3.1. 自定义注解

```java
@Target(ElementType.TYPE)  
@Retention(RetentionPolicy.RUNTIME)  
@Documented  
public @interface MyComponent {  
    String value() default "";  
}
```

##### 2.2.3.2. 标注自定义注解的类

```
​```java
@MyComponent  
public class Man {  
}
```

##### 2.2.3.3. 自定义过滤规则

```java
public class MyTypeFilter implements TypeFilter {  
    @Override  
    public boolean match(MetadataReader metadataReader, MetadataReaderFactory metadataReaderFactory) throws IOException {  
        AnnotationMetadata annotationMetadata = metadataReader.getAnnotationMetadata();  
        return annotationMetadata.hasAnnotation(MyComponent.class.getName());  
    }  
}
```

##### 2.2.3.4. 修改配置类

在原有的基础上，`includeFilters` 属性中增加一个自定义的过滤规则。

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookService.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
public class MainConfig {  
    @Bean  
    public Person person() {  
        return new Person("小让", 27);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126409.png)

#### 2.2.4. 细节分析 4：重复注解

不知道有没有细心的小伙伴注意到 `@ComponentScan` 注解上有一个 `@Repeatable` 注解，`@Repeatable` 注解是在 JDK1.8 出现的，作用是 **可以在一个类上标注重复的注解**。

```java
@Documented  
@Retention(RetentionPolicy.RUNTIME)  
@Target(ElementType.ANNOTATION_TYPE)  
public @interface Repeatable {  
    Class<? extends Annotation> value();  
}
```

 `@Repeatable` 注解中的 `value` 属性值为一个 `@ComponentScans` 注解类。 `@ComponentScans` 注解内部只声明了一个返回 `ComponentScan` 注解数组的 `value` 属性。  

```java
@Retention(RetentionPolicy.RUNTIME)  
@Target(ElementType.TYPE)  
@Documented  
public @interface ComponentScans {  
   ComponentScan[] value();  
}
```

也就是说可以在现在的配置类上标注多个 `@ComponentScan` 注解，修改一下现有的配置类：

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookRepository.class})  
}, useDefaultFilters = false)  
public class MainConfig {  
    @Bean  
    public Person person() {  
        return new Person("小让", 27);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126463.png)

### 2.3. @Scope 注解

Spring 容器中的组件 **默认是单例的**，在容器启动的时候就会去实例化并初始化对象，并将其存放到容器当中，之后每次获取组件时，就直接从 Spring 容器中获取，而不用再创建一个新的对象。如果说，从容器中获取组件时就是想获取一个新的实例，那么该如何处理呢？此时就需要用到 **`@Scope` 注解来设置组件的作用域**。`@Scope` 注解相当于配置文件中 `bean` 标签的 `scope` 属性。

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Scope {

	/**
	 * Alias for {@link #scopeName}.
	 * @see #scopeName
	 */
	@AliasFor("scopeName")
	String value() default "";

	/**
	 * Specifies the name of the scope to use for the annotated component/bean.
	 * <p>Defaults to an empty string ({@code ""}) which implies
	 * {@link ConfigurableBeanFactory#SCOPE_SINGLETON SCOPE_SINGLETON}.
	 * @since 4.2
	 * @see ConfigurableBeanFactory#SCOPE_PROTOTYPE
	 * @see ConfigurableBeanFactory#SCOPE_SINGLETON
	 * @see org.springframework.web.context.WebApplicationContext#SCOPE_REQUEST
	 * @see org.springframework.web.context.WebApplicationContext#SCOPE_SESSION
	 * @see #value
	 */
	@AliasFor("value")
	String scopeName() default "";

	ScopedProxyMode proxyMode() default ScopedProxyMode.DEFAULT;
}
```

- SCOPE_PROTOTYPE：多实例，容器启动时并不会实例化对象，而是在每次从容器获取对象时都去创建一个新的实例对象返回。
- SCOPE_SINGLETON：单实例（默认值），容器启动的时候就会去实例化并初始化组件，并将其存放到容器当中。
- SCOPE_REQUEST：需要处在 web 环境下才能生效，表示每次请求都会创建一个新的实例对象，但是在同一次请求中只会创建一个实例对象。
- SCOPE_SESSION：需要处在 web 环境下才能生效，表示在同一个 session 范围内，只会创建一个新的实例对象。

#### 2.3.1. 单实例 bean 作用域

配置类：

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookRepository.class})  
}, useDefaultFilters = false)  
public class MainConfig {  
    private static final Logger LOGGER = LoggerFactory.getLogger(MainConfig.class);  
  
    @Bean  
    public Person person() {  
        LOGGER.info("向Spring容器中添加Person组件");  
        return new Person("小让", 27);  
    }  
}
```

测试类：

```java
public class SpringAnnotationConfigurationOfScopeTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationOfScopeTest.class);  
  
    @Test  
    public void test() {  
        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfig.class);  
        LOGGER.info("容器启动之后，获取Person组件之前");  
        Person person = applicationContext.getBean(Person.class);  
        Person person2 = applicationContext.getBean(Person.class);  
        LOGGER.info("是否同一个person实例？{}", person == person2);  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126449.png)  
结果表明：**容器中的组件默认是单实例的，在容器启动的时候就会去实例化并初始化组件，并将其存放到容器当中，之后每次从容器中获取到的实例对象都是同一个**。  
💡需要注意的是：单例对象是整个应用共享的，所以需要考虑线程安全问题。

#### 2.3.2. 多实例 bean 作用域

修改原有的配置类，在 `@Bean` 注解标注的 `person()` 上加上 `@Scope` 注解，并且 `value` 属性值为 `prototype`。

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookRepository.class})  
}, useDefaultFilters = false)  
public class MainConfig {  
    private static final Logger LOGGER = LoggerFactory.getLogger(MainConfig.class);  
  
    @Scope(value = "prototype")  
    @Bean  
    public Person person() {  
        LOGGER.info("向Spring容器中添加Person组件");  
        return new Person("小让", 27);  
    }  
}
```

测试代码不变，运行 `SpringAnnotationConfigurationOfScopeTest` 测试类中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120126677.png)  
结果表明：**容器启动时并不会实例化对象，而是在每次从容器获取对象时都去创建一个新的实例对象返回**。

### 2.4. @Lazy 注解

Spring 容器启动时，默认会将单实例 bean 进行实例化，并加载到容器当中。如果需要将某个单实例 bean 进行延迟加载，那么该如何处理呢？此时，就需要用到 `@Lazy` 注解。  
何为懒加载？懒加载也称延时加载，**仅针对单实例 bean 生效**。让单实例 bean 在 Spring 容器启动时，先不进行实例化，而是等到第一次获取该 bean 实例时才进行实例化和初始化，然后加载到 Spring 容器中并返回该单实例 bean。  

修改原有的配置类，在 `@Bean` 注解标注的 `person()` 上加上 `@Lazy` 注解，同时去掉前面加上的 `@Scope` 注解。

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookRepository.class})  
}, useDefaultFilters = false)  
public class MainConfig {  
    private static final Logger LOGGER = LoggerFactory.getLogger(MainConfig.class);  
  
    @Lazy  
    @Bean    
    public Person person() {  
        LOGGER.info("向Spring容器中添加Person组件");  
        return new Person("小让", 27);  
    }  
}
```

测试代码不变，运行 `SpringAnnotationConfigurationOfScopeTest` 测试类中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120127097.png)

### 2.5. @Conditional 注解

Spring 支持根据条件向容器中注册 bean，满足条件的 bean 才会被注册到容器中。那么在 Spring 中是如何实现根据条件向容器中注册 bean 的呢？此时，就需要用到 `@Conditional` 注解。

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Conditional {

	/**
	 * All {@link Condition Conditions} that must {@linkplain Condition#matches match}
	 * in order for the component to be registered.
	 */
	Class<? extends Condition>[] value();
}
```

从 `@Conditional` 注解的源码来看，`@Conditional` 注解不仅可以在作用在类上，也可以作用在方法上。`@Conditional` 注解有一个 `value` 属性，类型为 `Condition` 接口数组。

```java
@FunctionalInterface  
public interface Condition {  
	boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata);  
}
```

所有自定义条件都需要实现该接口，重写其中的 matches 方法，当返回值为 true 时，才会将被注册到 Spring 容器中。  
现在，提出一个新的需求：如果当前系统是 Windows 系统那么就向 Spring 容器中注册名称为 bill 的 `Person` 对象；如果当前系统是 Linux 系统，那么就向 Spring 容器中注册名称为 linus 的 `Person` 对象。  
自定义条件 `WindowsCondition`：

```java
public class WindowsCondition implements Condition {  
    @Override  
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {  
        Environment environment = context.getEnvironment();  
        String property = environment.getProperty("os.name");  
        return Objects.requireNonNull(property).contains("Windows");  
    }  
}
```

自定义条件 `LinuxCondition`：

```java
public class LinuxCondition implements Condition {  
    @Override  
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {  
        Environment environment = context.getEnvironment();  
        String property = environment.getProperty("os.name");  
        return Objects.requireNonNull(property).contains("Linux");  
    }  
}
```

修改原有的配置类，增加两个被 `@Bean` 注解标注的方法，返回值类型为 `Person` 类型。

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookRepository.class})  
}, useDefaultFilters = false)  
public class MainConfig {  
    private static final Logger LOGGER = LoggerFactory.getLogger(MainConfig.class);  
  
    @Lazy  
    @Bean    public Person person() {  
        LOGGER.info("向Spring容器中添加Person组件");  
        return new Person("小让", 27);  
    }  
  
    @Conditional(WindowsCondition.class)  
    @Bean("bill")  
    public Person person1() {  
        LOGGER.info("向Spring容器中添加Person（bill）组件");  
        return new Person("bill", 65);  
    }  
  
    @Conditional(LinuxCondition.class)  
    @Bean("linus")  
    public Person person2() {  
        LOGGER.info("向Spring容器中添加Person（linus）组件");  
        return new Person("linus", 50);  
    }  
}
```

现在使用的是 Windows 系统，所以只会向容器中注册 bill 的组件。运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120127605.png)  
现在将运行环境改成 Linux 环境，怎么做呢？打开 Run/Debug Configurations => 添加 JVM 参数 `-Dos.name=Linux`。  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120127824.png)  
现在运行环境就变成 Linux 系统环境，运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120127529.png)  
只向容器中注册 linus 的组件，而没有将 bill 组件注册到容器中。

### 2.6. @Import 注解

在项目开发中，自己写的类可以通过包扫描 (`@ComponentScan`)+ 组件标注注解 (`@Controller`、`@Service`、`@Repository`、`@Component`) 的形式将 bean 对象注册到 Spring 容器当中，但是这种方式比较有局限性，只能是自己写的类，才能标注以上的注解。如果不是自己写的类，如引入的一些第三方类库中的类，那么如何将这样的类注册到 Spring 容器中呢？前面已经提到过一种解决方法：`@Configuration` + `@Bean`，现在介绍另外一种方法：使用 `@Import` 注解快速向 Spring 容器中导入一个组件。

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

`@Import` 注解只能作用在类上，通常都是和配置类一起使用。从源码中可以看出 `@Import` 注解中的 `value` 属性可以使用标注 `@Configuration` 注解的类、实现 `ImportSelector` 接口的类、实现 `ImportBeanDefinitionRegistrar` 接口的类或者一个简单的类都可以。

#### 2.6.1. 简单的类

```java
public class Color {  

}
```

修改原有的配置类，在类上标注 `@Import` 注解

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookRepository.class})  
}, useDefaultFilters = false)  
@Import({Color.class})  
public class MainConfig {  
    private static final Logger LOGGER = LoggerFactory.getLogger(MainConfig.class);  
  
    @Lazy  
    @Bean    public Person person() {  
        LOGGER.info("向Spring容器中添加Person组件");  
        return new Person("小让", 27);  
    }  
  
    @Conditional(WindowsCondition.class)  
    @Bean("bill")  
    public Person person1() {  
        LOGGER.info("向Spring容器中添加Person（bill）组件");  
        return new Person("bill", 65);  
    }  
  
    @Conditional(LinuxCondition.class)  
    @Bean("linus")  
    public Person person2() {  
        LOGGER.info("向Spring容器中添加Person（linus）组件");  
        return new Person("linus", 50);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120127759.png)

#### 2.6.2. ImportSelector 接口

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

需求：使用 `ImportSelector` 接口的方式向 Spring 容器中导入 `yellow` 和 `blue` 两个组件。

```java
public class Yellow {

}

public class Blue {

}
```

`ImportSelector` 接口实现类：

```java
public class MyImportSelector implements ImportSelector {  
    @Override  
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {  
        return new String[]{"top.xiaorang.spring.annotation.bean.yellow", "top.xiaorang.spring.annotation.bean.Blue"};
```

修改原有的配置类，在类上标注的 `@Import` 注解的 `value` 属性中增加 `ImportSelector` 接口的实现类：

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookRepository.class})  
}, useDefaultFilters = false)  
@Import({Color.class, MyImportSelector.class})  
public class MainConfig {  
    private static final Logger LOGGER = LoggerFactory.getLogger(MainConfig.class);  
  
    @Lazy  
    @Bean    public Person person() {  
        LOGGER.info("向Spring容器中添加Person组件");  
        return new Person("小让", 27);  
    }  
  
    @Conditional(WindowsCondition.class)  
    @Bean("bill")  
    public Person person1() {  
        LOGGER.info("向Spring容器中添加Person（bill）组件");  
        return new Person("bill", 65);  
    }  
  
    @Conditional(LinuxCondition.class)  
    @Bean("linus")  
    public Person person2() {  
        LOGGER.info("向Spring容器中添加Person（linus）组件");  
        return new Person("linus", 50);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120127729.png)

#### 2.6.3. ImportBeanDefinitionRegistrar 接口

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

由源码可以看出，在 `ImportBeanDefinitionRegistrar` 接口中有一个 `registerBeanDefinitions()` 方法，通过该方法可以向 Spring 容器注册 bean 的定义信息，后续根据 bean 的定义信息去创建 bean 的实例对象。所有实现了 `ImportBeanDefinitionRegistrar` 接口的类都会被 `ConfigurationClassPostProcessor` 处理，`ConfigurationClassPostProcessor` 实现了 `BeanFactoryPostProcessor` 接口。  
现在看下 `@Import` 注解配合 `ImportBeanDefinitionRegistrar` 接口的实现类是如何向 Spring 容器中注册 bean 的？需求：使用 `ImportBeanDefinitionRegistrar` 接口的方式向 Spring 容器中导入 `Rainbow` 组件。

```java
public class Rainbow { 

}
```

`ImportBeanDefinitionRegistrar` 接口实现类：

```java
public class MyImportBeanDefinitionRegistrar implements ImportBeanDefinitionRegistrar {  
    @Override  
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {  
        RootBeanDefinition rootBeanDefinition = new RootBeanDefinition();  
        rootBeanDefinition.setBeanClass(Rainbow.class);  
        registry.registerBeanDefinition("rainbow", rootBeanDefinition);  
    }  
}
```

修改原有的配置类，在类上标注的 `@Import` 注解的 `value` 属性中增加 `ImportBeanDefinitionRegistrar` 接口的实现类：

```java
@Configuration  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Controller.class}),  
        @ComponentScan.Filter(type = FilterType.CUSTOM, classes = {MyTypeFilter.class})  
}, excludeFilters = {  
        @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = {Service.class})  
}, useDefaultFilters = false)  
@ComponentScan(value = "top.xiaorang.spring.annotation", includeFilters = {  
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {BookRepository.class})  
}, useDefaultFilters = false)  
@Import({Color.class, MyImportSelector.class, MyImportBeanDefinitionRegistrar.class})  
public class MainConfig {  
    private static final Logger LOGGER = LoggerFactory.getLogger(MainConfig.class);  
  
    @Lazy  
    @Bean    public Person person() {  
        LOGGER.info("向Spring容器中添加Person组件");  
        return new Person("小让", 27);  
    }  
  
    @Conditional(WindowsCondition.class)  
    @Bean("bill")  
    public Person person1() {  
        LOGGER.info("向Spring容器中添加Person（bill）组件");  
        return new Person("bill", 65);  
    }  
  
    @Conditional(LinuxCondition.class)  
    @Bean("linus")  
    public Person person2() {  
        LOGGER.info("向Spring容器中添加Person（linus）组件");  
        return new Person("linus", 50);  
    }  
}
```

运行 `SpringAnnotationConfigurationTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120127237.png)

### 2.7. FactoryBean

`FactoryBean` 接口在 Spring 框架中占用非常重要的地位，Spring 自身就提供了大量的 `FactoryBean` 接口实现。它们隐藏了实例化一些复杂对象时的具体细节，给上层应用带来了便利。 在 Spring 中最为典型的一个 `FactoryBean` 实现就是 `ProxyFactoryBean`， 用来创建 AOP 的代理对象 ；用过 `Mybatis` 的肯定也知道另一个 `FctoryBean` 接口实现 `SqlSessionFactoryBean`，用来创建 `SqlSessionFactory` 对象。从 Spring3.0 开始，FactoryBean 开始支持泛型，即接口声明改为 `FactoryBean<T>` 的形式。

```java
public interface FactoryBean<T> {  
    String OBJECT_TYPE_ATTRIBUTE = "factoryBeanObjectType";  
  
    @Nullable  
    T getObject() throws Exception;  
  
    @Nullable  
    Class<?> getObjectType();  
  
    default boolean isSingleton() {  
        return true;  
    }  
}
```

其中，`getObject()` 方法返回创建出来的实例对象；`getObjectType()` 方法返回实例对象的具体类型；`isSingleton()` 返回实例对象的作用域是否单例对象，是单例对象的话，每次调用 `getObject()` 方法返回的实例对象是同一个。  
💡需要注意的是：当配置文件中 `bean` 标签的 `class` 属性为 `FactoryBean` 接口的实现类时，通过 `getBean()` 方法获取的实例对象不是 `FactoryBean` 实现类，而是 `FactoryBean#getObject()` 方法所返回的实例对象。

创建一个 `ColorFactoryBean` 类，实现 `FactoryBean` 接口，用于生产 `Color` 实例对象。

```java
public class ColorFactoryBean implements FactoryBean<Color> {  
    @Override  
    public Color getObject() throws Exception {  
        return new Color();  
    }  
  
    @Override  
    public Class<?> getObjectType() {  
        return Color.class;  
    }  
  
    @Override  
    public boolean isSingleton() {  
        return true;  
    }  
}
```

创建一个新的配置类 `MainConfig2`：

```java
@Configuration  
public class MainConfig2 {  
    @Bean  
    public ColorFactoryBean colorFactoryBean() {  
        return new ColorFactoryBean();  
    }  
}
```

测试类：

```java
public class SpringAnnotationConfigurationOfFactoryBeanTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationOfFactoryBeanTest.class);  
  
    @Test  
    public void test() {  
        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfig2.class);  
        String[] beanDefinitionNames = applicationContext.getBeanDefinitionNames();  
        for (String beanDefinitionName : beanDefinitionNames) {  
            LOGGER.info(beanDefinitionName);  
        }  
  
        Object bean = applicationContext.getBean("colorFactoryBean");  
        Object bean2 = applicationContext.getBean("colorFactoryBean");  
        LOGGER.info("获取到的bean实例：{}", bean);  
        LOGGER.info("获取到的实例是否同一个？{}", bean == bean2);  
    }  
}
```

测试结果如下所示：  如果调用 `getBean() ` 方法时想获取一个新的实例对象，怎么做呢？很简单，只需要让 `isSingleton()` 方法返回 false 即可。  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120127235.png)  
使用 `@Bean` 注解向 Spring 容器中注册的是 `ColorFactoryBean`，调用 getBean() 方法获取出来的却是 `Color` 对象，那么我就是想获取 `ColorFactoryBean` 类型的对象实例呢？其实，也很简单，只需在调用 `getBean()` 方法时传入的 id 前加上 `&` 符号，如 `&colorFactoryBean`，获取的就是 `ColorFactoryBean` 对象实例。

```java
public class SpringAnnotationConfigurationOfFactoryBeanTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationOfFactoryBeanTest.class);  
  
    @Test  
    public void test() {  
        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfig2.class);  
        String[] beanDefinitionNames = applicationContext.getBeanDefinitionNames();  
        for (String beanDefinitionName : beanDefinitionNames) {  
            LOGGER.info(beanDefinitionName);  
        }  
  
        Object bean = applicationContext.getBean("colorFactoryBean");  
        Object bean2 = applicationContext.getBean("colorFactoryBean");  
        LOGGER.info("获取到的bean实例：{}", bean);  
        LOGGER.info("获取到的实例是否同一个？{}", bean == bean2);  
  
        Object bean3 = applicationContext.getBean("&colorFactoryBean");  
        LOGGER.info("获取到的bean实例：{}", bean3);  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128006.png)

## 3. 生命周期

```ad-important
1. BeanNameAware 的 setBeanName  
2. BeanClassLoaderAware 的 setBeanClassLoader  
3. BeanFactoryAware 的 setBeanFactory  
4. EnvironmentAware 的 setEnvironment  
5. EmbeddedValueResolverAware 的 setEmbeddedValueResolver  
6. ResourceLoaderAware 的 setResourceLoader （仅在应用程序上下文中运行时适用）  
7. ApplicationEventPublisherAware 的 setApplicationEventPublisher （仅在应用程序上下文中运行时适用）  
8. MessageSourceAware 的 setMessageSource （仅在应用程序上下文中运行时适用）  
9. ApplicationContextAware 的 setApplicationContext （仅在应用程序上下文中运行时适用）  
10. ServletContextAware 的 setServletContext （仅适用于在 Web 应用程序上下文中运行时）  
11. **BeanPostProcessors** 的 **postProcessBeforeInitialization** 方法  
12. **InitializingBean** 的 **afterPropertiesSet**  
13. **自定义 init-method** 定义  
14. **BeanPostProcessors** 的 **postProcessAfterInitialization** 方法  

在关闭 bean 工厂时，将应用以下生命周期方法：  

1. **DestructionAwareBeanPostProcessors** 的 **postProcessBeforeDestruction** 方法  
2. **DisposableBean** 的 **destroy**  
3. **自定义 destroy-method** 定义
```

### 3.1. init-method & destroy-method

在使用 XML 配置文件注册 bean 时，可以通过 `bean` 标签中的 `init-method` 和 `destory-method` 属性分别指定 bean 的初始化和销毁方法。如下所示：  
修改 `applicationContext.xml` 配置文件注释掉包扫描配置，去掉 `bean` 标签中的 `scope="prototype"` 属性。

```xml
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  
       xmlns="http://www.springframework.org/schema/beans"  
       xsi:schemaLocation="http://www.springframework.org/schema/beans  
       http://www.springframework.org/schema/beans/spring-beans.xsd">  
    <!--    <context:component-scan base-package="top.xiaorang.spring.annotation"/>-->  
  
    <bean id="person" class="top.xiaorang.spring.annotation.bean.Person" init-method="init" destroy-method="destroy">  
        <property name="name" value="xiaorang"/>  
        <property name="age" value="12"/>  
    </bean>  
</beans>
```

需要注意的是：在 `Person` 需要存在 `init()` 与 `destroy()` 方法，而且 Spring 中还规定 `init()` 与 `destroy()` 方法必须是无参方法，但可以抛出异常。  
修改 `SpringXmlConfigurationTest` 测试类中的 `test()` 方法：

```java
public class SpringXmlConfigurationTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringXmlConfigurationTest.class);  
  
    @Test  
    public void test() {  
        ClassPathXmlApplicationContext applicationContext = new ClassPathXmlApplicationContext("classpath:applicationContext.xml");  
        String[] beanDefinitionNames = applicationContext.getBeanDefinitionNames();  
        for (String beanDefinitionName : beanDefinitionNames) {  
            LOGGER.info(beanDefinitionName);  
        }  
        applicationContext.close();  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128314.png)  

XML 配置的方式已经了解，那么如何使用注解的方式指定 bean 的初始化和销毁方法呢？别急，先看看下面的例子。

```java
public class Car {  
    public Car() {  
        System.out.println("car... constructor...");  
    }  
  
    public void init() {  
        System.out.println("car... init...");  
    }  
  
    public void destroy() {  
        System.out.println("car... destroy...");  
    }  
}
```

创建一个配置类 `MainConfigOfLifeCycle`，指定 `@Bean` 注解中的 `initMethod` 和 `destroyMethod` 属性分别对应 `Car` 类中的 `init()` 初始化和 `destroy()` 销毁方法。

```java
@Configuration  
public class MainConfigOfLifeCycle {  
    @Bean(initMethod = "init", destroyMethod = "destroy")  
    public Car car() {  
        return new Car();  
    }  
}
```

创建一个新的测试类 `SpringAnnotationConfigurationOfLifeCycleTest`：

```java
public class SpringAnnotationConfigurationOfLifeCycleTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationOfLifeCycleTest.class);  
  
    @Test  
    public void test() {  
        AnnotationConfigApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfigOfLifeCycle.class);  
        String[] beanDefinitionNames = applicationContext.getBeanDefinitionNames();  
        for (String beanDefinitionName : beanDefinitionNames) {  
            LOGGER.info(beanDefinitionName);  
        }  
        applicationContext.close();  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128335.png)  

一个典型的使用场景就是对于数据源的管理。如，在配置数据源时，在初始化时，可以对数据源的属性进行赋值操作；在销毁的时候，需要对数据源的连接信息进行关闭和清理。此时，就可以在自定义的初始化和销毁方法中来做这些事情了。  
💡需要注意的是：多实例的 bean 在容器关闭的时候是不进行销毁的，也就是说，Spring 容器创建出多实例对象后，至于什么时候销毁就是自己的事情，Spring 不再管理这些多实例 bean 对象。

### 3.2. InitializingBean & DisposableBean

Spring 容器在 bean 实例化以及属性赋值之后可以执行 `InitializingBean` 接口中的 `afterPropertiesSet()` 方法。

```java
public interface InitializingBean {
	void afterPropertiesSet() throws Exception;
}
```

Spring 容器在关闭之后会执行 `DisposableBean` 接口中的 `destroy()` 方法。

```java
public interface DisposableBean {
	void destroy() throws Exception;
}
```

如果不去追源码的话，其实理解起来还是挺简单的，不过以后会有机会去追追源码，现在先学会用。废话不多说，开干。  
首先，创建一个 `Cat` 类同时实现 `InitializingBean` 和 `DisposableBean` 接口：

```java
public class Cat implements InitializingBean, DisposableBean {  
    public Cat() {  
        System.out.println("cat constructor...");  
    }  
  
    @Override  
    public void afterPropertiesSet() throws Exception {  
        System.out.println("cat afterPropertiesSet...");  
    }  
  
    @Override  
    public void destroy() throws Exception {  
        System.out.println("cat destroy...");  
    }  
}
```

修改配置类 `MainConfigOfLifeCycle`：

```java
@Configuration  
public class MainConfigOfLifeCycle {  
    @Bean(initMethod = "init", destroyMethod = "destroy")  
    public Car car() {  
        return new Car();  
    }  
  
    @Bean  
    public Cat cat() {  
        return new Cat();  
    }  
}
```

运行 `SpringAnnotationConfigurationOfLifeCycleTest` 测试类中的测试方法 `test()`，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128337.png)

## 4. 属性赋值

在使用 XML 配置文件注册 bean 时，可以通过 `bean` 标签中嵌套 `property` 标签给 bean 中的属性赋值。如下所示：

```xml
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  
       xmlns="http://www.springframework.org/schema/beans"  
       xsi:schemaLocation="http://www.springframework.org/schema/beans  
       http://www.springframework.org/schema/beans/spring-beans.xsd">  
    <!--    <context:component-scan base-package="top.xiaorang.spring.annotation"/>-->  
  
    <bean id="person" class="top.xiaorang.spring.annotation.bean.Person" init-method="init" destroy-method="destroy">  
        <property name="name" value="xiaorang"/>  
        <property name="age" value="12"/>  
    </bean>  
</beans>
```

`property` 标签中的 `name` 属性为 bean 中字段的名称，`value` 属性为要赋给 bean 中对应字段的值。  
XML 配置的方式已经了解，那么如何使用注解的方式给 bean 中的属性赋值呢？此时，就需要用到 Spring 中的 `@Value` 注解。

```java
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Value {

	/**
	 * The actual value expression such as <code>#{systemProperties.myProp}</code>
	 * or property placeholder such as <code>${my.app.myProp}</code>.
	 */
	String value();

}
```

从 `@Value` 注解源码可以看出，`@Value` 注解可以标注在字段、方法、参数以及注解上，并且在程序运行期间生效。  `@Value` 注解的主要作用是 **完成属性的赋值**。  
支持 基本类型和 String 类型的数据，Spring 的 EL 表达式，通过 `${}` 的方式获取配置文件中的数据，配置文件支持 properties，xml 和 yml 文件。

```java
public class Teacher {  
    /**  
     * String类型  
     */  
    @Value("小让")  
    private String name;  
    /**  
     * SPEL表达式  
     */  
    @Value("#{30-3}")  
    private int age;
      
    @Value("#{T(Math).random()}")  
    private double salary;  
    /**  
	 * 从环境变量中取值  
	 */  
	@Value("${teacher.workDate}")  
	private String workDate;  
	/**  
	 * 从环境变量中取值，如果没有该配置，则给一个默认值  
	 */ 
    @Value("${teacher.teach:english}")  
    private String teach;  
  
    @Override  
    public String toString() {  
        return "Teacher{" +  
                "name='" + name + '\'' +  
                ", age=" + age +  
                ", salary=" + salary +  
                ", workDate='" + workDate + '\'' +  
                ", teach='" + teach + '\'' +  
                '}';  
    }  
}
```

创建一个配置类 `MainConfigOfPropertyValue`：

```java
@Configuration  
public class MainConfigOfPropertyValue {  
    @Bean  
    public Teacher teacher() {  
        return new Teacher();  
    }  
}
```

创建一个新的测试类 `SpringAnnotationConfigurationOfPropertyValueTest`：

```java
public class SpringAnnotationConfigurationOfPropertyValueTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationOfPropertyValueTest.class);  
  
    @Test  
    public void test() {  
        AnnotationConfigApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfigOfPropertyValue.class);  
        Teacher teacher = applicationContext.getBean(Teacher.class);  
        LOGGER.info("\n获取到的teacher实例：{}", teacher);  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128952.png)  
细心的小伙伴可能已经发现，`teacher` 实例对象中的 `workDate` 属性值好像有点不对啊！这是怎么回事？原因是环境变量中并没有该配置，所以直接将表达式原样输出，并没有像网上说的那样直接报错（可能是版本不同吧）。那么这个问题怎么解决呢？  
现在需要使用另外一个注解 `@ProperySource`，该注解等价于 XML 配置文件中的 `<context:property-placeholder location="classpath:xxx.properties"/>` 标签，用于将配置文件中的 key=value 存储到 Spring 的环境变量 `Environment` 中，然后 `Environment` 接口提供了方法去读取配置文件中的值，当然也可以通过 `@Value` 注解以 `${}` 的方式获取配置文件中对应 key 的 value 值注入到 bean 的属性中。  
在资源目录下增加一个 `teacher.properties` 配置文件：

```properties
teacher.workDate=2022-08-29  
teacher.teach=math
```

现在修改配置类 `MainConfigOfPropertyValue`：增加 `@ProperySource` 注解，其 `value` 属性值为配置文件的路径。

```java
@Configuration  
@PropertySource({"classpath:teacher.properties"})  
public class MainConfigOfPropertyValue {  
    @Bean  
    public Teacher teacher() {  
        return new Teacher();  
    }  
}
```

再次执行测试类 `SpringAnnotationConfigurationOfPropertyValueTest` 中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128843.png)

💡需要注意的是，**`#{}` 主要用于执行 SPEL 表达式**，**`${}` 主要用于获取配置文件的值**。

## 5. 自动装配

### 5.1. @Autowired 注解

在 XML 配置文件中给一个 bean 中的属性注入另一个 bean 时，需要用到 `property` 标签中的 `ref` 属性。如下所示：

```xml
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  
       xmlns:context="http://www.springframework.org/schema/context" xmlns="http://www.springframework.org/schema/beans"  
       xsi:schemaLocation="http://www.springframework.org/schema/beans  
       http://www.springframework.org/schema/beans/spring-beans.xsd http://www.springframework.org/schema/context https://www.springframework.org/schema/context/spring-context.xsd">  
    <!--    <context:component-scan base-package="top.xiaorang.spring.annotation"/>-->  
  
    <bean id="person" class="top.xiaorang.spring.annotation.bean.Person" init-method="init" destroy-method="destroy">  
        <property name="name" value="xiaorang"/>  
        <property name="age" value="12"/>  
    </bean>  
  
    <context:property-placeholder location="classpath:teacher.properties"/>  
  
    <bean id="bookRepository" class="top.xiaorang.spring.annotation.repository.BookRepository"/>  
    <bean id="bookService" class="top.xiaorang.spring.annotation.service.BookService">  
        <property name="bookRepository" ref="bookRepository"/>  
    </bean>  
    <bean id="bookController" class="top.xiaorang.spring.annotation.controller.BookController">  
        <property name="bookService" ref="bookService"/>  
    </bean>  
</beans>
```

修改 `BookController` 类：

```java
@Controller  
public class BookController {  
    private BookService bookService;  
  
    public BookService getBookService() {  
        return bookService;  
    }  
  
    public void setBookService(BookService bookService) {  
        this.bookService = bookService;  
    }  
  
    @Override  
    public String toString() {  
        return "BookController{" +  
                "bookService=" + bookService +  
                '}';  
    }  
}
```

修改 `BookService` 类：

```java
@Service  
public class BookService {  
    private BookRepository bookRepository;  
  
    public BookRepository getBookRepository() {  
        return bookRepository;  
    }  
  
    public void setBookRepository(BookRepository bookRepository) {  
        this.bookRepository = bookRepository;  
    }  
  
    @Override  
    public String toString() {  
        return "BookService{" +  
                "bookRepository=" + bookRepository +  
                '}';  
    }  
}
```

修改测试类 `SpringXmlConfigurationTest`：

```java
public class SpringXmlConfigurationTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringXmlConfigurationTest.class);  
  
    @Test  
    public void test() {  
        ClassPathXmlApplicationContext applicationContext = new ClassPathXmlApplicationContext("classpath:applicationContext.xml");  
        BookController bookController = applicationContext.getBean(BookController.class);  
        LOGGER.info("\n获取到的bean实例：{}", bookController);  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128545.png)  
虽然通过 XML 的方式可以实现将一个 bean 注入给另外一个 bean 中的属性中，但是这样非常繁琐，有没有更加简便的方式呢？那就不得不提到今天的主角 `@Autowired` 注解。

```java
@Target({ElementType.CONSTRUCTOR, ElementType.METHOD, ElementType.PARAMETER, ElementType.FIELD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Autowired {

	/**
	 * Declares whether the annotated dependency is required.
	 * <p>Defaults to {@code true}.
	 */
	boolean required() default true;

}
```

从源码中可以看出，`@Autowired` 注解可以标注在构造方法、方法、参数、字段以及注解上。那么如何通过 `@Autowired` 注解实现 XML 配置文件方式相同的效果呢？  
给 `BookController` 类中的 `bookService` 属性上标注 `@Autowired` 注解：

```java
@Controller  
public class BookController {  
    @Autowired  
    private BookService bookService;  
  
    public BookService getBookService() {  
        return bookService;  
    }  
  
    public void setBookService(BookService bookService) {  
        this.bookService = bookService;  
    }  
  
    @Override  
    public String toString() {  
        return "BookController{" +  
                "bookService=" + bookService +  
                '}';  
    }  
}
```

给 `BookService` 类中的 `bookRepository` 属性上标注 `@Autowired` 注解：

```java
@Service  
public class BookService {  
    @Autowired  
    private BookRepository bookRepository;  
  
    public BookRepository getBookRepository() {  
        return bookRepository;  
    }  
  
    public void setBookRepository(BookRepository bookRepository) {  
        this.bookRepository = bookRepository;  
    }  
  
    @Override  
    public String toString() {  
        return "BookService{" +  
                "bookRepository=" + bookRepository +  
                '}';  
    }  
}
```

创建一个新的配置类：扫描 `repository`、`service` 和 `controller` 包，将 `BookController`、`BookService` 和 `BookRepository` 三个组件注册到 Spring 容器当中。

```java
@Configuration  
@ComponentScan({"top.xiaorang.spring.annotation.repository", "top.xiaorang.spring.annotation.service", "top.xiaorang.spring.annotation.controller"})  
public class MainConfigOfAutowired {  
}
```

创建测试类 `SpringAnnotationConfigurationOfAutowiredTest`：

```java
public class SpringAnnotationConfigurationOfAutowiredTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationOfAutowiredTest.class);  
  
    @Test  
    public void test() {  
        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfigOfAutowired.class);  
        BookController bookController = applicationContext.getBean(BookController.class);  
        LOGGER.info("\n获取到的bean实例：{}", bookController);  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128792.png)  
💡需要注意的是：**`@Autowired` 注解默认是按照类型进行装配的**。那么存在多个类型相同的组件时该如何进行装配呢？  
定义一个 `OrderService` 接口，存在两个实现类 `OrderServiceImpl` 和 `OrderServiceImpl2`：

```java
public interface OrderService {

}

@Service  
public class OrderServiceImpl implements OrderService {  
    private String label = "1";  
  
    @Override  
    public String toString() {  
        return "OrderServiceImpl{" +  
                "label='" + label + '\'' +  
                '}';  
    }  
}

@Service  
public class OrderServiceImpl2 implements OrderService {  
    private String label = "2";  
  
    @Override  
    public String toString() {  
        return "OrderServiceImpl{" +  
                "label='" + label + '\'' +  
                '}';  
    }  
}
```

创建 `OrderController` 类，需要注入一个 `OrderService` 类型的 bean：

```java
@Controller  
public class OrderController {  
    @Autowired  
    private OrderService orderService;  
  
    public OrderService getOrderService() {  
        return orderService;  
    }  
  
    public void setOrderService(OrderService orderService) {  
        this.orderService = orderService;  
    }  
}
```

运行测试类 `SpringAnnotationConfigurationOfAutowiredTest` 中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128573.png)  
发现报错，意思是需要注入唯一的一个 bean，但是却发现 2 个匹配的，此时怎么办呢？**`@Autowired` 注解默认是按照类型进行装配的，当找到多个相同类型的组件时，将继续按照属性名称去匹配**。

#### 5.1.1. 修改属性名

第一种解决方案就是修改属性名，使其与其中一个组件的名称相同。将 `orderService` 属性名改成 `orderServiceImpl`，如下所示：

```java
@Controller  
public class OrderController {  
    @Autowired  
    private OrderService orderServiceImpl;  
  
    public OrderService getOrderServiceImpl() {  
        return orderServiceImpl;  
    }  
  
    public void setOrderServiceImpl(OrderService orderServiceImpl) {  
        this.orderServiceImpl = orderServiceImpl;  
    }  
  
    @Override  
    public String toString() {  
        return "OrderController{" +  
                "orderService=" + orderServiceImpl +  
                '}';  
    }  
}
```

修改测试类 `SpringAnnotationConfigurationOfAutowiredTest`：

```java
public class SpringAnnotationConfigurationOfAutowiredTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationOfAutowiredTest.class);  
  
    @Test  
    public void test() {  
        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfigOfAutowired.class);  
        BookController bookController = applicationContext.getBean(BookController.class);  
        LOGGER.info("\n获取到的bean实例：{}", bookController);  
        OrderController orderController = applicationContext.getBean(OrderController.class);  
        LOGGER.info("\n获取到的bean实例：{}", orderController);  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128037.png)

#### 5.1.2. @Qualifier 注解

通常情况下，`@Qualifier` 注解必须搭配 `@Autowired` 注解一起使用，同样能解决 `@Autowired` 注解匹配到多个类型相同的组件时而报错的问题，可以通过 `Qualifier` 注解明确需要装配哪个组件。

```java
@Controller  
public class OrderController {  
    @Qualifier("orderServiceImpl2")  
    @Autowired  
    private OrderService orderServiceImpl;  
  
    public OrderService getOrderServiceImpl() {  
        return orderServiceImpl;  
    }  
  
    public void setOrderServiceImpl(OrderService orderServiceImpl) {  
        this.orderServiceImpl = orderServiceImpl;  
    }  
  
    @Override  
    public String toString() {  
        return "OrderController{" +  
                "orderService=" + orderServiceImpl +  
                '}';  
    }  
}
```

运行测试类 `SpringAnnotationConfigurationOfAutowiredTest` 中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128659.png)  
💡需要注意的是：当属性名与 `@Qualifier` 注解一起作用时，以 `@Qualifier` 注解为主，如果找不到 `@Qualifier` 注解标注的组件，则直接报错。

#### 5.1.3. @Primary 注解

当在某个接口的实现类组件上标注 `@Primary` 注解时，如果该接口存在多个实现类组件，则会优先注入标注了 `@Primary` 注解的实现类组件。  
修改 `OrderController`，去掉 `orderService` 属性上标注的 `@Qualifier` 注解：

```java
@Controller  
public class OrderController {  
    @Autowired  
    private OrderService orderServiceImpl;  
  
    public OrderService getOrderServiceImpl() {  
        return orderServiceImpl;  
    }  
  
    public void setOrderServiceImpl(OrderService orderServiceImpl) {  
        this.orderServiceImpl = orderServiceImpl;  
    }  
  
    @Override  
    public String toString() {  
        return "OrderController{" +  
                "orderService=" + orderServiceImpl +  
                '}';  
    }  
}
```

在 `OrderServiceImpl` 类标注 `@Primary` 注解，表示优先注入该组件：

```java
@Primary  
@Service  
public class OrderServiceImpl2 implements OrderService {  
    private String label = "2";  
  
    @Override  
    public String toString() {  
        return "OrderServiceImpl{" +  
                "label='" + label + '\'' +  
                '}';  
    }  
}
```

运行测试类 `SpringAnnotationConfigurationOfAutowiredTest` 中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120128544.png)  
💡需要注意的是：当属性名与 `@Primary` 注解一起作用时，以 `@Primary` 注解为主；当 `@Primary` 与 `@Qualifier` 注解一起作用时，以 `@Qualifier` 注解为主；如果找不到 `@Qualifier` 注解标注的组件，则直接报错。  
💡需要注意的是：`@Autowired` 注解默认是必须找到某个 bean 进而完成注入，如果找不到，则会抛出异常。如果想要找不到不抛出异常，只需要将 `@Autowired` 注解的 `required` 属性置为 false 即可。

```ad-info
`@Autowried` 注解可以标注在类，方法，属性，参数位置上，但是**阿里巴巴开发手册**建议我们**标注在构造器上**，**如果标注在构造器上，那么构造器中的参数必须是IOC容器中的bean实例**，而且**如果只有一个有参构造器，那么构造器上的 @Autowired 注解可以省略**
```

### 5.2. @Resourece 注解

```java
@Target({TYPE, FIELD, METHOD})
@Retention(RUNTIME)
public @interface Resource {
    String name() default "";
    String lookup() default "";
    Class<?> type() default java.lang.Object.class;
    enum AuthenticationType {
            CONTAINER,
            APPLICATION
    }
    AuthenticationType authenticationType() default AuthenticationType.CONTAINER;
    boolean shareable() default true;
    String mappedName() default "";
    String description() default "";
}
```

`@Resourece` 注解是 `JSR250` 规范里定义的一个注解，注解中有两个重要的属性 `name` 和 `type`。 

- 如果指定了 `name` 属性 和 `type` 属性，则从 Spring 容器中找一个名称与 `name` 属性和类型与 `type` 属性都相同的组件，找不到则报错。
- 如果只指定了 `name` 属性，则从 Spring 容器中找一个名称与 `name` 属性相同的组件，找不到则报错。
- 如果只指定了 `type` 属性，则从 Spring 容器中找一个类型与与 `type` 属性相同的组件，找不到或者找到多个类型相同的组件则报错。
- 如果两个属性都没有指定，则 **默认按照名称进行装配进行装配**，按名称找不到则按类型进行装配，如果找到多个类型相同的组件则判断是否存在组件标注 `@Primary` 注解，如果没有，则报找到多个组件的异常；如果按类型还是找不到则报错。  

修改原有的 `OrderController` 类进行测试：

```java
@Controller  
public class OrderController {  
    @Resource  
    private OrderService orderService;  
  
    public OrderService getOrderService() {  
        return orderService;  
    }  
  
    public void setOrderService(OrderService orderService) {  
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

修改 `OrderServiceImpl2` 类，去掉 `@Primary` 注解：

```java
@Service  
public class OrderServiceImpl2 implements OrderService {  
    private String label = "2";  
  
    @Override  
    public String toString() {  
        return "OrderServiceImpl{" +  
                "label='" + label + '\'' +  
                '}';  
    }  
}
```

运行测试类 `SpringAnnotationConfigurationOfAutowiredTest` 中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120129496.png)  
报错信息 `No qualifying bean of type 'top.xiaorang.spring.annotation.service.OrderService' available: expected single matching bean but found 2: orderServiceImpl,orderServiceImpl2`，大概意思就是找到两个类型相同的组件。如何解决呢？①在 `@Autowired` 注解中的解决方案在这里都适用，如修改属性名，搭配 `@Qualifier` 注解或者 `@Primary` 注解。②或者指定 `@Reaource` 标签中的 `name` 属性和 `type` 属性。  
现在试下指定 `@Resource` 注解的 `name` 属性为 `orderServiceImpl2`：

```java
public class OrderController {  
    @Resource(name = "orderServiceImpl2")  
    private OrderService orderService;  
  
    public OrderService getOrderService() {  
        return orderService;  
    }  
  
    public void setOrderService(OrderService orderService) {  
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

运行测试类 `SpringAnnotationConfigurationOfAutowiredTest` 中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120129052.png)

### 5.3. @Profile 注解

#### 5.3.1. 写在前面

在实际项目开发中，往往会将项目环境分为开发环境、测试环境和生产环境等等。在以前的开发过程中，需要手动修改配置文件的形式，将项目的配置修改成测试环境，然后才发布到测试环境中进行测试，测试通过后，再将项目的配置修改成生成环境，然后正式发布到生产环境中。这样手动修改配置文件的方式，不仅增加了开发和运维的工作量，而且总是手动修改各项配置文件很容易出问题。那么有没有办法解决这种吃力不讨好的方式呢？有，使用 `@Profile` 注解即可。

#### 5.3.2. 概述

`@Profile` 注解是 Spring 提供的可以根据当前环境动态激活和切换一系列组件的功能。这个功能主要针对在不同的环境使用不同的变量，如，在开发环境、测试环境和生产环境下需要使用不同的数据源，在不改变代码的情况下，可以使用这个注解来动态地切换要连接地数据库。

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Conditional(ProfileCondition.class)
public @interface Profile {

	/**
	 * The set of profiles for which the annotated component should be registered.
	 */
	String[] value();

}
```

从源码可以看出，`@Profile` 注解可以标注在类和方法上。  
💡需要注意的是：当 `@Profile` 注解标注在配置类上时，只有在指定的环境下，整个配置类中的所有配置才会生效；当 bean 上标注 `@Profile` 注解，也只有在指定环境下才会被注册到 Spring 容器中，如果没有标注 `@Profile` 注解的话，那么这个 bean 在任何环境下都会被注册到 Spring 容器中，前提是配置类符合条件。

#### 5.3.3. 案例

以一个简单的例子来演示一下，假如有三个人，分别是张三、李四、王五，在 dev 环境下存在张三，在 test 环境下存在李四，生产环境下存在王五，指定哪个环境，谁就被注册到容器中。  
创建一个新的配置类 `MainConfigOfProfile`：

```java
@Configuration  
public class MainConfigOfProfile {  
    @Profile("dev")  
    @Bean  
    public Person person1() {  
        return new Person("张三", 18);  
    }  
  
    @Profile("test")  
    @Bean  
    public Person person2() {  
        return new Person("李四", 23);  
    }  
  
    @Profile("prod")  
    @Bean  
    public Person person3() {  
        return new Person("王五", 30);  
    }  
}
```

创建一个新的测试类 `SpringAnnotationConfigurationOfProfileTest`：

```java
public class SpringAnnotationConfigurationOfProfileTest {  
    private static final Logger LOGGER = LoggerFactory.getLogger(SpringAnnotationConfigurationOfProfileTest.class);  
  
    @Test  
    public void test() {  
        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(MainConfigOfProfile.class);  
        Map<String, Person> beansOfType = applicationContext.getBeansOfType(Person.class);  
        LOGGER.info("获取到的teacher实例：{}", beansOfType);  
    }  
}
```

测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120129565.png)  
惊讶地发现没有找到任何 `Person` 组件，这是为什么？？原因是所有 bean 都加了 `@Profile` 注解，只有在指定的环境下当前的 bean 才会被注册到容器中，然而 **默认的环境为 `default`**，在 `default` 环境下当然找不到 `Person` 组件，所以现在让默认环境下将 `Person` 张三注册到 Spring 容器中。

```java
@Configuration  
public class MainConfigOfProfile {  
    @Profile({"dev", "default"})  
    @Bean  
    public Person person1() {  
        return new Person("张三", 18);  
    }  
  
    @Profile("test")  
    @Bean  
    public Person person2() {  
        return new Person("李四", 23);  
    }  
  
    @Profile("prod")  
    @Bean  
    public Person person3() {  
        return new Person("王五", 30);  
    }  
}
```

运行测试类 `SpringAnnotationConfigurationOfProfileTest` 中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120129657.png)  
假如，想将 Person 李四和王五注册到 Spring 容器中，就需要修改环境，怎么修改呢？在 `@Profile` 注解的注释明确指出了以下几种方法来切换环境：

>可以通过 ConfigurableEnvironment.setActiveProfiles 以编程方式激活，或者通过将 spring.profiles.active 属性设置为 JVM 系统属性、环境变量或 web.xml 中的 Servlet 上下文参数以声明方式激活应用程序

现在通过使用虚拟机参数来将环境切换到 dev 和 prod 环境，`-Dspring.profiles.active=test,prod`。  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120129136.png)  
运行测试类 `SpringAnnotationConfigurationOfProfileTest` 中的 `test()` 方法，测试结果如下所示：  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120129405.png)  
