Add-Type -AssemblyName System.Drawing

$img_path = "c:\Users\sunjs\Desktop\Projects\GAMES\three-as-one\public\assests\characters\officer\officer.png"
$out_path = "c:\Users\sunjs\Desktop\Projects\GAMES\three-as-one\public\assests\characters\officer\officer_idle.png"

$img = [System.Drawing.Image]::FromFile($img_path)
$width = $img.Width
$height = $img.Height
$frame_w = [int][math]::Floor($width / 4)

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.Clear([System.Drawing.Color]::Transparent)

$srcRect = New-Object System.Drawing.Rectangle(0, 0, $frame_w, $height)

$destRect0 = New-Object System.Drawing.Rectangle(0, 0, $frame_w, $height)
$graphics.DrawImage($img, $destRect0, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$destRect1 = New-Object System.Drawing.Rectangle([int]$frame_w, [int]2, $frame_w, $height)
$graphics.DrawImage($img, $destRect1, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$destRect2 = New-Object System.Drawing.Rectangle([int]($frame_w * 2), [int]4, $frame_w, $height)
$graphics.DrawImage($img, $destRect2, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$destRect3 = New-Object System.Drawing.Rectangle([int]($frame_w * 3), [int]2, $frame_w, $height)
$graphics.DrawImage($img, $destRect3, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Save($out_path, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bmp.Dispose()
$img.Dispose()

echo "Successfully created 4 frame idle animation at $out_path"
