args <- commandArgs(trailingOnly = TRUE)
root <- if (length(args)) args[[1]] else "."
if (!requireNamespace("jsonlite", quietly = TRUE)) stop("Install the jsonlite package")
read_rows <- function(name) {
  filepath <- file.path(root, name)
  if (file.info(filepath)$size == 0) return(data.frame())
  con <- file(filepath, open = "r")
  on.exit(close(con))
  jsonlite::stream_in(con, verbose = FALSE)
}
snapshot <- jsonlite::fromJSON(file.path(root, "snapshot.json"))
administrations <- read_rows("administrations.ndjson")
responses <- read_rows("responses.ndjson")
print(list(snapshotId = snapshot$snapshotId,
           administrations = nrow(administrations), responses = nrow(responses)))
