Add-Type -AssemblyName System.Drawing

$source = "C:\Users\prem\.gemini\antigravity-ide\brain\660d72ce-b33f-4ade-86ab-f9b5e4d83a74\media__1780484201588.jpg"
if (-not (Test-Path -Path $source)) {
    Write-Error "Source image not found: $source"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($source)

# Helper function to crop and resize
function CropAndResize($srcImg, $cropX, $cropY, $cropSize, $destWidth, $destHeight, $destPath) {
    # Create target directory if it doesn't exist
    $dir = Split-Path -Path $destPath
    if (-not (Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $bmp = New-Object System.Drawing.Bitmap($destWidth, $destHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Configure high quality resizing settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropSize, $cropSize)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $destWidth, $destHeight)

    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    
    # Save as PNG
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated: $destPath"
}

# 1. Generate Logo (cropped from top, size 620x620, centered at X=512, Y=430)
# Coordinates: X: 202 to 822 (width 620), Y: 120 to 740 (height 620)
$cropX_logo = 202
$cropY_logo = 120
$cropSize_logo = 620

CropAndResize $img $cropX_logo $cropY_logo $cropSize_logo 512 512 "d:\New folder\NimbusX\assets\images\logo.png"
CropAndResize $img $cropX_logo $cropY_logo $cropSize_logo 512 512 "d:\New folder\NimbusX\src\assets\images\logo.png"

# 2. Generate App Icon (cropped from bottom, size 200x200, centered at X=512, Y=873)
# Coordinates: X: 412 to 612 (width 200), Y: 773 to 973 (height 200)
$cropX_icon = 412
$cropY_icon = 773
$cropSize_icon = 200

# Android Launcher Icons
$androidMipmaps = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $androidMipmaps.Keys) {
    $size = $androidMipmaps[$folder]
    $basePath = "d:\New folder\NimbusX\android\app\src\main\res\$folder"
    CropAndResize $img $cropX_icon $cropY_icon $cropSize_icon $size $size "$basePath\ic_launcher.png"
    CropAndResize $img $cropX_icon $cropY_icon $cropSize_icon $size $size "$basePath\ic_launcher_round.png"
}

# iOS App Icons
$iosIcons = @{
    "icon-20@2x.png" = 40
    "icon-20@3x.png" = 60
    "icon-29@2x.png" = 58
    "icon-29@3x.png" = 87
    "icon-40@2x.png" = 80
    "icon-40@3x.png" = 120
    "icon-60@2x.png" = 120
    "icon-60@3x.png" = 180
    "icon-1024.png"  = 1024
}

$iosPath = "d:\New folder\NimbusX\ios\NimbusX\Images.xcassets\AppIcon.appiconset"
foreach ($filename in $iosIcons.Keys) {
    $size = $iosIcons[$filename]
    CropAndResize $img $cropX_icon $cropY_icon $cropSize_icon $size $size "$iosPath\$filename"
}

$img.Dispose()
Write-Output "Asset generation completed successfully!"
