@echo off
title Portfolio editor - KEEP THIS WINDOW OPEN
cd /d "%~dp0"

echo.
echo   ============================================================
echo     PORTFOLIO EDITOR
echo   ============================================================
echo.
echo   Your browser will open in a moment.
echo.
echo     Deck:  http://localhost:4000/
echo     CV:    http://localhost:4000/cv/
echo.
echo   Click EDIT, click any outlined text, type over it, click SAVE.
echo.
echo   KEEP THIS WINDOW OPEN while you are editing.
echo   Closing it stops the editor and the page will stop loading.
echo.
echo   When you are done editing, close this window and run:
echo     node tools\deploy.mjs
echo   ============================================================
echo.

start "" http://localhost:4000/
node tools\edit.mjs

echo.
echo   The editor stopped.
echo.
echo   If that happened immediately, the usual cause is that port 4000
echo   is already in use - another editor window is probably still open.
echo   Close it, or set a different port:   set EDIT_PORT=4001
echo.
pause
