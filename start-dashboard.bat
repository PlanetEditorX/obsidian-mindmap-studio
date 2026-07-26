@echo off
cd /D "D:\Downloads\obsidian-mindmap-studio"
echo ========================================
echo  Obsidian Mindmap Studio - Dashboard
echo ========================================
echo.
echo Starting server...
start /B "" python -m http.server 5173 --bind 127.0.0.1 -d ".ua\dashboard"
timeout /t 3 /nobreak >nul
echo Opening dashboard in browser...
start "" http://127.0.0.1:5173/?token=ua-local-dev-token
echo.
echo Dashboard: http://127.0.0.1:5173/?token=ua-local-dev-token
echo.
echo Close this window or press any key to stop.
pause >nul
echo Stopping server...
taskkill /f /im python.exe 2>nul
echo Done.
exit
