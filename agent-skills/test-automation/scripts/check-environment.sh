#!/usr/bin/env bash
# Orion test-automation on-kontrol scripti.
# Her senaryo calistirmadan once bu scripti calistir; ortamin hazir
# olup olmadigini (DB container, ZK backend, React dev server) tek
# seferde raporlar. Cikis kodu 0 ise hepsi hazir, degilse en az bir
# bilesen eksik/kapali demektir - agent bu durumda kullaniciya ilgili
# bileseni baslatmasini onermeli ya da (izin varsa) kendisi baslatmali.
#
# Kullanim: bash check-environment.sh

set -uo pipefail

ok=1

echo "=== Orion test-automation ortam kontrolu ==="

# 1. MSSQL container
status=$(docker ps -a --filter name=orion-mssql --format "{{.Status}}" 2>/dev/null)
if [[ "$status" == *"healthy"* ]]; then
  echo "[OK]   orion-mssql container: $status"
else
  echo "[FAIL] orion-mssql container bulunamadi veya healthy degil: '${status:-yok}'"
  ok=0
fi

# 2. ZK backend (Spring Boot, :8080)
code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/collateral/transfers 2>/dev/null)
if [[ "$code" == "200" ]]; then
  echo "[OK]   ZK backend (localhost:8080): $code"
else
  echo "[FAIL] ZK backend (localhost:8080) yanit vermiyor: HTTP $code"
  ok=0
fi

# 3. React dev server (:5173) - opsiyonel, sadece React senaryolari icin gerekli
code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null)
if [[ "$code" == "200" ]]; then
  echo "[OK]   React dev server (localhost:5173): $code"
else
  echo "[WARN] React dev server (localhost:5173) yanit vermiyor: HTTP $code (sadece React senaryolari icin gerekli)"
fi

# 4. Node.js + npm erisilebilir mi
if command -v node >/dev/null 2>&1; then
  echo "[OK]   node: $(node --version)"
else
  echo "[FAIL] node PATH'te bulunamadi"
  ok=0
fi

echo ""
if [[ "$ok" == "1" ]]; then
  echo "SONUC: Ortam hazir, senaryolar calistirilabilir."
  exit 0
else
  echo "SONUC: Ortam eksik/hazir degil, yukaridaki [FAIL] satirlarini once gider."
  exit 1
fi
