package com.orion.assistant.tool;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orion.cash.domain.CashTransactionRequest;
import com.orion.cash.service.CashTransactionService;
import com.orion.collateral.domain.CollateralTransfer;
import com.orion.collateral.dto.CollateralTransferDto;
import com.orion.collateral.dto.CollateralTransferMapper;
import com.orion.collateral.repository.CollateralTransferRepository;
import com.orion.collateral.service.CollateralService;
import com.orion.core.dto.RoleDto;
import com.orion.core.dto.RoleMapper;
import com.orion.core.dto.UserDto;
import com.orion.core.dto.UserMapper;
import com.orion.core.service.UserService;
import com.orion.workflow.domain.WorkflowTask;
import com.orion.workflow.service.WorkflowTaskService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Read-only tools the assistant may invoke. No create/update/delete paths.
 */
@Service
public class AssistantToolService {

    private static final String DEMO_USER = "admin";

    private final CollateralService collateralService;
    private final CollateralTransferRepository transferRepository;
    private final CollateralTransferMapper collateralTransferMapper;
    private final CashTransactionService cashTransactionService;
    private final UserService userService;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final WorkflowTaskService workflowTaskService;
    private final ObjectMapper objectMapper;

    public AssistantToolService(CollateralService collateralService,
                                 CollateralTransferRepository transferRepository,
                                 CollateralTransferMapper collateralTransferMapper,
                                 CashTransactionService cashTransactionService,
                                 UserService userService,
                                 UserMapper userMapper,
                                 RoleMapper roleMapper,
                                 WorkflowTaskService workflowTaskService,
                                 ObjectMapper objectMapper) {
        this.collateralService = collateralService;
        this.transferRepository = transferRepository;
        this.collateralTransferMapper = collateralTransferMapper;
        this.cashTransactionService = cashTransactionService;
        this.userService = userService;
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.workflowTaskService = workflowTaskService;
        this.objectMapper = objectMapper;
    }

    public static List<Map<String, Object>> geminiFunctionDeclarations() {
        List<Map<String, Object>> fns = new ArrayList<>();
        fns.add(fn("listCollateralTransfers", "Bekleyen veya filtreli teminat transfer taleplerini listeler (read-only).",
                Map.of("durum", prop("string", "Opsiyonel durum filtresi: BEKLEMEDE, TAMAMLANDI, IPTAL, REVIZYONDA, HAVUZDA"))));
        fns.add(fn("getCollateralTransferById", "Tek bir teminat transfer talebinin detayını getirir.",
                Map.of("id", prop("integer", "Transfer kayıt ID"))));
        fns.add(fn("listUsers", "Kullanıcıları listeler veya arar (read-only).",
                Map.of("q", prop("string", "Opsiyonel arama metni (kullanıcı adı veya ad soyad)"))));
        fns.add(fn("listRoles", "Tanımlı tüm rolleri listeler (read-only).", Map.of()));
        fns.add(fn("listCashTransactionRequests", "Nakit işlem taleplerini listeler (read-only).",
                Map.of("durum", prop("string", "Opsiyonel durum: BEKLEMEDE, ONAYLANDI, REDDEDILDI, TAMAMLANDI"))));
        fns.add(fn("listOpenWorkflowTasks", "Açık workflow görevlerini listeler (demo kullanıcı: admin).", Map.of()));
        return fns;
    }

    public ToolExecutionResult execute(String toolName, Map<String, Object> args) {
        try {
            return switch (toolName) {
                case "listCollateralTransfers" -> listCollateralTransfers(args);
                case "getCollateralTransferById" -> getCollateralTransferById(args);
                case "listUsers" -> listUsers(args);
                case "listRoles" -> listRoles();
                case "listCashTransactionRequests" -> listCashTransactionRequests(args);
                case "listOpenWorkflowTasks" -> listOpenWorkflowTasks();
                default -> ToolExecutionResult.error("Bilinmeyen tool: " + toolName);
            };
        } catch (Exception e) {
            return ToolExecutionResult.error(e.getMessage());
        }
    }

    private ToolExecutionResult listCollateralTransfers(Map<String, Object> args) throws JsonProcessingException {
        String durum = stringArg(args, "durum");
        List<CollateralTransfer> items = (durum == null || durum.isBlank())
                ? collateralService.getAllTransfers()
                : collateralService.getTransfersByDurum(durum);
        List<CollateralTransferDto> dtos = collateralTransferMapper.toDtoList(items);
        return ToolExecutionResult.ok("listCollateralTransfers", args, dtos.size(), toJson(dtos));
    }

    private ToolExecutionResult getCollateralTransferById(Map<String, Object> args) throws JsonProcessingException {
        Long id = longArg(args, "id");
        if (id == null) {
            return ToolExecutionResult.error("id parametresi gerekli");
        }
        Optional<CollateralTransfer> transfer = transferRepository.findById(id);
        if (transfer.isEmpty()) {
            return ToolExecutionResult.ok("getCollateralTransferById", args, 0, "{\"found\":false}");
        }
        CollateralTransferDto dto = collateralTransferMapper.toDto(transfer.get());
        return ToolExecutionResult.ok("getCollateralTransferById", args, 1, toJson(dto));
    }

    private ToolExecutionResult listUsers(Map<String, Object> args) throws JsonProcessingException {
        String q = stringArg(args, "q");
        List<UserDto> dtos = userMapper.toDtoList(userService.search(q));
        return ToolExecutionResult.ok("listUsers", args, dtos.size(), toJson(dtos));
    }

    private ToolExecutionResult listRoles() throws JsonProcessingException {
        List<RoleDto> dtos = roleMapper.toDtoList(userService.getAllRoles());
        return ToolExecutionResult.ok("listRoles", Map.of(), dtos.size(), toJson(dtos));
    }

    private ToolExecutionResult listCashTransactionRequests(Map<String, Object> args) throws JsonProcessingException {
        String durum = stringArg(args, "durum");
        List<CashTransactionRequest> all = cashTransactionService.getAll();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (CashTransactionRequest r : all) {
            if (durum != null && !durum.isBlank() && !durum.equalsIgnoreCase(r.getDurum())) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", r.getId());
            row.put("hesapNo", r.getAccount() != null ? r.getAccount().getHesapNo() : null);
            row.put("durum", r.getDurum());
            row.put("tutar", r.getTutar());
            row.put("paraBirimi", r.getParaBirimi());
            row.put("islemYonu", r.getIslemYonu());
            rows.add(row);
        }
        return ToolExecutionResult.ok("listCashTransactionRequests", args, rows.size(), toJson(rows));
    }

    private ToolExecutionResult listOpenWorkflowTasks() throws JsonProcessingException {
        List<WorkflowTask> tasks = workflowTaskService.getAcikGorevler(DEMO_USER);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (WorkflowTask t : tasks) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", t.getId());
            if (t.getProcess() != null) {
                row.put("surecNo", t.getProcess().getSurecNo());
                row.put("surecTipi", t.getProcess().getSurecTipi());
            }
            row.put("gorevOzeti", t.getGorevOzeti());
            row.put("durum", t.getDurum());
            rows.add(row);
        }
        return ToolExecutionResult.ok("listOpenWorkflowTasks", Map.of(), rows.size(), toJson(rows));
    }

    private String toJson(Object value) throws JsonProcessingException {
        return objectMapper.writeValueAsString(value);
    }

    private static Map<String, Object> fn(String name, String description, Map<String, Map<String, String>> properties) {
        Map<String, Object> fn = new LinkedHashMap<>();
        fn.put("name", name);
        fn.put("description", description);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("type", "OBJECT");
        params.put("properties", properties);
        params.put("required", List.of());
        fn.put("parameters", params);
        return fn;
    }

    private static Map<String, String> prop(String type, String description) {
        Map<String, String> p = new HashMap<>();
        p.put("type", type.toUpperCase(Locale.ROOT));
        p.put("description", description);
        return p;
    }

    private static String stringArg(Map<String, Object> args, String key) {
        Object v = args.get(key);
        return v == null ? null : String.valueOf(v);
    }

    private static Long longArg(Map<String, Object> args, String key) {
        Object v = args.get(key);
        if (v == null) {
            return null;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static final class ToolExecutionResult {
        private final boolean success;
        private final String tool;
        private final Map<String, Object> input;
        private final int recordCount;
        private final String jsonPayload;
        private final String error;

        private ToolExecutionResult(boolean success, String tool, Map<String, Object> input,
                                    int recordCount, String jsonPayload, String error) {
            this.success = success;
            this.tool = tool;
            this.input = input;
            this.recordCount = recordCount;
            this.jsonPayload = jsonPayload;
            this.error = error;
        }

        static ToolExecutionResult ok(String tool, Map<String, Object> input, int count, String json) {
            return new ToolExecutionResult(true, tool, input, count, json, null);
        }

        static ToolExecutionResult error(String message) {
            return new ToolExecutionResult(false, null, Map.of(), 0, null, message);
        }

        public boolean isSuccess() {
            return success;
        }

        public String getTool() {
            return tool;
        }

        public Map<String, Object> getInput() {
            return input;
        }

        public int getRecordCount() {
            return recordCount;
        }

        public String getJsonPayload() {
            return jsonPayload;
        }

        public String getError() {
            return error;
        }
    }
}
