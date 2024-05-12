@echo off

if exist "%USERPROFILE%\Downloads\Juggle" (
  cd /d "%USERPROFILE%\Downloads\Juggle"
) else if exist "%USERPROFILE%\Desktop\Juggle" (
  cd /d "%USERPROFILE%\Desktop\Juggle"
) else if exist "%USERPROFILE%\Documents\Juggle" (
  cd /d "%USERPROFILE%\Documents\Juggle"
) else if exist "C:\Juggle" (
  cd /d "C:\Juggle"
) else if exist "D:\Juggle" (
  cd /d "D:\Juggle"
) else if exist "E:\Juggle" (
  cd /d "E:\Juggle"
) else if exist "F:\Juggle" (
  cd /d "F:\Juggle"
) else (
  echo.
  echo Juggle project not found in common locations.
  echo Please enter the full path to the Juggle directory:
  set /p PROJECT_PATH=""

  if exist "%PROJECT_PATH%" (
    cd /d "%PROJECT_PATH%"
  ) else (
    echo Invalid path. Exiting...
    exit /b
  )
)

npm install && (
  ng build && (
    cd /d server
    node server.js
    pause
  )
)
