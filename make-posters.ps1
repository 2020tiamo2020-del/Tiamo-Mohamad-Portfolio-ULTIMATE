# Makes a poster (.webp) next to every video, same name:  Cinematic\cinematic0.webm -> Cinematic\cinematic0.webp
# Needs ffmpeg in PATH.  Run from the site's root folder:  powershell -ExecutionPolicy Bypass -File make-posters.ps1
foreach ($dir in "Cinematic", "VFX") {
  if (-not (Test-Path $dir)) { continue }
  Get-ChildItem "$dir\*.webm" | ForEach-Object {
    $out = Join-Path $_.DirectoryName ($_.BaseName + ".webp")
    ffmpeg -loglevel error -y -ss 0.6 -i $_.FullName -frames:v 1 -vf "scale='min(640,iw)':-2" -c:v libwebp -quality 78 $out
    Write-Host "poster: $out"
  }
}
