package crm.controller;

import crm.entity.Lead;
import crm.repository.LeadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final LeadRepository leadRepository;

    public DashboardController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @GetMapping("/leads")
    public ResponseEntity<Map<String, Object>> getLeadStats(
            @RequestParam(name = "period", defaultValue = "30d") String period,
            @RequestParam(name = "companyId", required = false) String companyId,
            @RequestParam(name = "funnelId", required = false) String funnelId
    ) {
        try {
            List<Lead> leads;
            if (companyId != null && !companyId.isBlank()) {
                if (funnelId != null && !funnelId.isBlank() && !"all".equalsIgnoreCase(funnelId)) {
                    leads = leadRepository.findAllByCompanyIdAndFunnelId(companyId, funnelId);
                } else {
                    leads = leadRepository.findAllByCompanyId(companyId);
                }
            } else {
                if (funnelId != null && !funnelId.isBlank() && !"all".equalsIgnoreCase(funnelId)) {
                    leads = leadRepository.findAllByFunnelId(funnelId);
                } else {
                    leads = leadRepository.findAll();
                }
            }

            int periodDays = switch (period) {
                case "7d" -> 7;
                case "90d" -> 90;
                case "1y" -> 365;
                default -> 30;
            };
            Instant start = Instant.now().minus(periodDays, ChronoUnit.DAYS);

            int totalLeads = leads.size();
            int newLeads = (int) leads.stream()
                    .filter(l -> Optional.ofNullable(l.getCreatedAt()).orElse(Instant.EPOCH).isAfter(start))
                    .count();

            List<String> wonStatuses = Arrays.asList("ganho", "won", "fechado", "vendido", "convertido");
            int convertedLeads = (int) leads.stream()
                    .filter(l -> {
                        String st = Optional.ofNullable(l.getStatus()).orElse("");
                        String sLow = st.toLowerCase(Locale.ROOT);
                        return wonStatuses.stream().anyMatch(ws -> sLow.contains(ws));
                    })
                    .count();

            double conversionRate = totalLeads > 0 ? (convertedLeads * 100.0 / totalLeads) : 0.0;

            long totalValueCents = leads.stream().mapToLong(l -> Optional.ofNullable(l.getEstimatedValueCents()).orElse(0L)).sum();
            double totalValue = totalValueCents / 100.0;
            double avgValue = totalLeads > 0 ? totalValue / totalLeads : 0.0;

            Map<String, Long> byStatus = leads.stream()
                    .collect(Collectors.groupingBy(l -> Optional.ofNullable(l.getStatus()).orElse("unknown"), Collectors.counting()));

            Map<String, Long> bySource = leads.stream()
                    .collect(Collectors.groupingBy(l -> Optional.ofNullable(l.getSource()).orElse("other"), Collectors.counting()));

            // Value buckets
            record Bucket(String name, long min, long max) {}
            List<Bucket> buckets = List.of(
                    new Bucket("0-25k", 0, 25_000),
                    new Bucket("25k-50k", 25_000, 50_000),
                    new Bucket("50k-100k", 50_000, 100_000),
                    new Bucket("100k+", 100_000, Long.MAX_VALUE)
            );
            List<Map<String, Object>> leadValueData = new ArrayList<>();
            for (Bucket b : buckets) {
                long count = leads.stream()
                        .filter(l -> {
                            long v = Optional.ofNullable(l.getEstimatedValueCents()).orElse(0L) / 100;
                            return v >= b.min && v < b.max;
                        })
                        .count();
                double pct = totalLeads > 0 ? (count * 100.0 / totalLeads) : 0.0;
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("name", b.name);
                item.put("value", count);
                item.put("percentage", String.format(Locale.ROOT, "%.1f", pct));
                leadValueData.add(item);
            }

            List<Map<String, Object>> leadStatusData = byStatus.entrySet().stream()
                    .map(e -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("name", e.getKey());
                        m.put("value", e.getValue());
                        m.put("percentage", totalLeads > 0 ? String.format(Locale.ROOT, "%.1f", (e.getValue() * 100.0 / totalLeads)) : "0");
                        return m;
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> leadSourceData = bySource.entrySet().stream()
                    .map(e -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("name", e.getKey());
                        m.put("value", e.getValue());
                        m.put("percentage", totalLeads > 0 ? String.format(Locale.ROOT, "%.1f", (e.getValue() * 100.0 / totalLeads)) : "0");
                        return m;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> leadsStats = new LinkedHashMap<>();
            leadsStats.put("total", totalLeads);
            leadsStats.put("new", newLeads);
            leadsStats.put("converted", convertedLeads);
            leadsStats.put("conversionRate", conversionRate);
            leadsStats.put("totalValue", totalValue);
            leadsStats.put("avgValue", avgValue);
            leadsStats.put("newCount", byStatus.getOrDefault("novo", 0L));
            leadsStats.put("qualified", byStatus.getOrDefault("qualificado", 0L));
            leadsStats.put("proposal", byStatus.getOrDefault("proposta", 0L));
            leadsStats.put("negotiation", byStatus.getOrDefault("negociacao", 0L));
            leadsStats.put("lost", byStatus.getOrDefault("perdido", 0L));

            Map<String, Object> tasksStats = new LinkedHashMap<>();
            tasksStats.put("total", 0);
            tasksStats.put("completed", 0);
            tasksStats.put("pending", 0);
            tasksStats.put("overdue", 0);
            tasksStats.put("completionRate", 0.0);

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("leads", leadsStats);
            stats.put("tasks", tasksStats);

            Map<String, Object> charts = new LinkedHashMap<>();
            charts.put("leadStatus", leadStatusData);
            charts.put("leadSource", leadSourceData);
            charts.put("leadValue", leadValueData);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("stats", stats);
            body.put("charts", charts);
            body.put("leads", leads);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
