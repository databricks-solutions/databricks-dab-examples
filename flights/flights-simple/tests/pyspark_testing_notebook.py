# Databricks notebook source
# MAGIC %pip install pytest
# MAGIC dbutils.library.restartPython()

# COMMAND ----------

import pytest
import sys


def run_pytest(pytest_path):
  # Skip writing pyc files on a readonly filesystem.
  sys.dont_write_bytecode = True

  retcode = pytest.main([pytest_path, "-p", "no:cacheprovider", "-p", "no:warnings"])

  # Fail the cell execution if we have any test failures.
  assert retcode == 0, 'The pytest invocation failed. See the log above for details.'

# COMMAND ----------
## This path change is needed to make this run with Databricks Workflows (at least when kicking off from VS Code Extension). 
## It is not needed to run with databricks-connect or if your test notebook is in the project directory.
import os
current_dir = os.getcwd()
if current_dir.split('/')[-1] == 'tests':
  root_dir = os.path.dirname(current_dir)
  print("Root dir:", root_dir)
  os.chdir(root_dir)
  sys.path.append(root_dir + '/src')

# COMMAND ----------

run_pytest("tests/unit_transforms")

# COMMAND ----------

run_pytest("tests/unit_utils")
