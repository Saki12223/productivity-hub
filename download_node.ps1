$url = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
$output = "node_installer.msi"
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process msiexec.exe -Wait -ArgumentList "/i $output /quiet"
Remove-Item $output
