import os

import psycopg
from databricks.sdk import WorkspaceClient


class DatabaseConnection:
    def __init__(self):
        profile = os.getenv("DATABRICKS_PROFILE")
        self.workspace_client = (
            WorkspaceClient(profile=profile) if profile else WorkspaceClient()
        )

        self.postgres_username = (
            self.workspace_client.config.client_id
            or self.workspace_client.current_user.me().user_name
        )
        self.postgres_host = os.getenv("PGHOST")
        self.postgres_database = os.getenv("PGDATABASE")
        self.postgres_schema = os.getenv("PGSCHEMA", "default")
        self.postgres_table = "trips_synced"

        if not self.postgres_host:
            raise ValueError("PGHOST environment variable is required")

    def get_connection(self):
        token = self.workspace_client.config.oauth_token().access_token

        return psycopg.connect(
            host=self.postgres_host,
            port=5432,
            dbname=self.postgres_database,
            user=self.postgres_username,
            password=token,
            sslmode="require",
        )


db_connection = DatabaseConnection()
