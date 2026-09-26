@echo off
REM =====================================================
REM  S.U.R.Y.A. - SIH PPTX builder (requires python-pptx)
REM  Run:  build_pptx.bat
REM =====================================================
python -c "import pptx" 2>nul || pip install python-pptx
python build_sih_pptx.py
pause
