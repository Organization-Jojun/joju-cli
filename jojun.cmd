@echo off
setlocal
cd /d "%~dp0"
node "%~dp0node_modules\bare-runtime\bin\bare" "%~dp0bin.mjs" --no-updates %*
