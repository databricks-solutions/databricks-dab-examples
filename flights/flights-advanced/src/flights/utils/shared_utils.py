def append_to_delta(df, dest_table, streaming=False, checkpoint_location=None):
    if not streaming:
        df.write.format("delta").mode("append").saveAsTable(dest_table)
    else:
        df.writeStream.format("delta").outputMode("append").option("checkpointLocation", checkpoint_location).toTable(dest_table)
