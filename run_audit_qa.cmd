@echo off
set IMF_QA_BASE=https://wealth-subsequently-anthony-chairs.trycloudflare.com
set IMF_QA_USER=WFUENTES
set IMF_QA_PASSWORD=Imfohsa1234/
set NODE_PATH=C:\Users\William Fuentes\Documents\Codex\node_modules
node qa_admin.js
node qa_dark_scan.js > qa-dark-report.json
node qa_rapid_workflow.js > qa-rapid-report.json
