package com.orion.assistant.dto;

public class AssistantContextDto {

    private String pathname;
    private String pageTitle;
    private String selectedEntityType;
    private Long selectedEntityId;

    public String getPathname() {
        return pathname;
    }

    public void setPathname(String pathname) {
        this.pathname = pathname;
    }

    public String getPageTitle() {
        return pageTitle;
    }

    public void setPageTitle(String pageTitle) {
        this.pageTitle = pageTitle;
    }

    public String getSelectedEntityType() {
        return selectedEntityType;
    }

    public void setSelectedEntityType(String selectedEntityType) {
        this.selectedEntityType = selectedEntityType;
    }

    public Long getSelectedEntityId() {
        return selectedEntityId;
    }

    public void setSelectedEntityId(Long selectedEntityId) {
        this.selectedEntityId = selectedEntityId;
    }
}
