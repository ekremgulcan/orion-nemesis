package com.orion.core.config;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * ZK ViewModel'leri (ZK'nin kendi olusturdugu, Spring tarafindan yonetilmeyen
 * nesnelerdir) Spring bean'lerine erismek icin bu statik holder'i kullanir.
 * Normalde ZK7'de bu is WEB-INF/zk.xml icindeki variable-resolver +
 * DelegatingVariableResolver ile yapilir, ama Spring Boot'un gomulu Tomcat
 * kurulumunda ZK'nin ConfigParser'i bu elementi bazen tanimadigi icin
 * (ortama gore degisebilen bir davranis), daha guvenilir bir alternatif
 * olarak bu holder tercih edildi.
 */
@Component
public class SpringContextHolder implements ApplicationContextAware {

    private static ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        context = applicationContext;
    }

    public static <T> T getBean(Class<T> beanClass) {
        return context.getBean(beanClass);
    }

    public static Object getBean(String beanName) {
        return context.getBean(beanName);
    }
}
