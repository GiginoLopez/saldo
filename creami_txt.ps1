# Esegui dalla root del progetto
$Project = "."
$Out = "project_files.txt"
$Root = (Resolve-Path $Project).Path

# Estensioni testuali da includere
$include = @("*.ts","*.html","*.scss","*.css","*.json","*.md","*.txt")

$sw = [System.IO.StreamWriter]::new($Out, $false, [System.Text.Encoding]::UTF8)
try {
  Get-ChildItem -Path "$Project/src" -Recurse -File -Include $include | ForEach-Object {
    $rel = $_.FullName.Substring($Root.Length + 1) # percorso relativo
    $sw.WriteLine("==== FILE: $rel ====")
    $sw.Write((Get-Content $_.FullName -Raw))      # lettura rapida del file intero
    $sw.WriteLine()                                # riga vuota
  }
}
finally {
  $sw.Dispose()
}
