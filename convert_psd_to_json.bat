@echo off
setlocal EnableDelayedExpansion

REM === ImageMagick path (NO quotes here) ===
set MAGICK=P:\pipeline\extra_soft\ImageMagick-7.0.10-Q16\magick.exe

REM === Arguments ===
set PSD=%~1
set OUT=%~2

if "%PSD%"=="" (
    echo Usage: convert_psd_to_json_chatgpt.bat input.psd output.json
    exit /b 1
)

if "%OUT%"=="" (
    echo Usage: convert_psd_to_json_chatgpt.bat input.psd output.json
    exit /b 1
)

echo."%PSD%"
echo."%OUT%"

"%MAGICK%" convert "%PSD%" json: > "%OUT%"




