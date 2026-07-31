package com.orion.workflow.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WorkflowTaskDto {
    private Long id;
    private String surecNo;
    private String surecTipi;
    private String gorevOzeti;
    private String sahipAdSoyad;
    private String durum;
    private LocalDateTime atanmaTarihi;
    private LocalDateTime tamamlanmaTarihi;
}
