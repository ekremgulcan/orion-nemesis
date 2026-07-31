package com.orion.core.config;

import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.zkoss.zk.au.http.DHtmlUpdateServlet;
import org.zkoss.zk.ui.http.DHtmlLayoutServlet;
import org.zkoss.zk.ui.http.HttpSessionListener;

import java.util.HashMap;
import java.util.Map;

/**
 * ZK7 servlet'lerini Spring Boot'un gomulu Tomcat'ine kaydeder. ZK sayfalari
 * (.zul) src/main/webapp altinda durur ve bu servlet uzerinden sunulur.
 * ViewModel'ler icinde Spring bean'lerine erismek icin
 * org.zkoss.spring.SpringUtil.getBean("beanAdi") kullanilir (zk.xml'deki
 * DelegatingVariableResolver sayesinde).
 */
@Configuration
public class ZkSpringConfig {

    @Bean
    public ServletRegistrationBean<DHtmlLayoutServlet> zkLoaderServlet() {
        Map<String, String> initParams = new HashMap<>();
        initParams.put("update-uri", "/zkau");

        ServletRegistrationBean<DHtmlLayoutServlet> registration =
                new ServletRegistrationBean<>(new DHtmlLayoutServlet(), "*.zul");
        registration.setLoadOnStartup(1);
        registration.setInitParameters(initParams);
        registration.setName("zkLoader");
        return registration;
    }

    @Bean
    public ServletRegistrationBean<DHtmlUpdateServlet> zkAuEngineServlet() {
        Map<String, String> initParams = new HashMap<>();
        ServletRegistrationBean<DHtmlUpdateServlet> registration =
                new ServletRegistrationBean<>(new DHtmlUpdateServlet(), "/zkau/*");
        registration.setLoadOnStartup(1);
        registration.setInitParameters(initParams);
        registration.setName("auEngine");
        return registration;
    }

    @Bean
    public ServletListenerRegistrationBean<HttpSessionListener> zkSessionListener() {
        return new ServletListenerRegistrationBean<>(new HttpSessionListener());
    }
}
