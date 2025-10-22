# PowerShell script to create a properly sized icon for Windows desktop
# This script creates a new icon with better padding and all required sizes

Add-Type -AssemblyName System.Drawing

function Create-DesktopIcon {
    param(
        [string]$SourcePath,
        [string]$OutputPath
    )
    
    try {
        # Load the source image
        $sourceImage = [System.Drawing.Image]::FromFile($SourcePath)
        Write-Host "Loaded source image: $($sourceImage.Width)x$($sourceImage.Height)"
        
        # Create backup
        if (Test-Path "icon.ico.backup") {
            Remove-Item "icon.ico.backup"
        }
        Copy-Item $SourcePath "icon.ico.backup"
        Write-Host "Created backup: icon.ico.backup"
        
        # Define the sizes we need for Windows desktop icons
        $sizes = @(16, 24, 32, 48, 64, 128, 256)
        
        # Create a list to store all resized images
        $iconImages = @()
        
        foreach ($size in $sizes) {
            Write-Host "Creating ${size}x${size} version..."
            
            # Create a new bitmap with the target size
            $newBitmap = New-Object System.Drawing.Bitmap($size, $size)
            $graphics = [System.Drawing.Graphics]::FromImage($newBitmap)
            
            # Set high-quality rendering
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            
            # Calculate padding (10% on each side for better desktop display)
            $padding = [Math]::Floor($size * 0.1)
            $contentSize = $size - ($padding * 2)
            
            # Calculate the scale factor to fit the content area
            $scaleX = $contentSize / $sourceImage.Width
            $scaleY = $contentSize / $sourceImage.Height
            $scale = [Math]::Min($scaleX, $scaleY)
            
            $newWidth = [Math]::Floor($sourceImage.Width * $scale)
            $newHeight = [Math]::Floor($sourceImage.Height * $scale)
            
            # Center the image
            $x = ($size - $newWidth) / 2
            $y = ($size - $newHeight) / 2
            
            # Draw the resized image
            $graphics.DrawImage($sourceImage, $x, $y, $newWidth, $newHeight)
            
            $graphics.Dispose()
            $iconImages += $newBitmap
        }
        
        # Save the largest size as ICO (Windows will use this for desktop)
        $largestIcon = $iconImages[-1]  # 256x256
        $largestIcon.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Icon)
        
        Write-Host "Successfully created new icon: $OutputPath"
        Write-Host "New icon size: $($largestIcon.Width)x$($largestIcon.Height)"
        
        # Clean up
        $sourceImage.Dispose()
        foreach ($img in $iconImages) {
            $img.Dispose()
        }
        
        return $true
    }
    catch {
        Write-Error "Error creating icon: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
Write-Host "Starting icon improvement process..."

if (Test-Path "icon.ico") {
    $success = Create-DesktopIcon -SourcePath "icon.ico" -OutputPath "icon_new.ico"
    
    if ($success) {
        # Replace the old icon with the new one
        Remove-Item "icon.ico"
        Rename-Item "icon_new.ico" "icon.ico"
        Write-Host "Successfully updated icon.ico with improved desktop display"
    } else {
        Write-Host "Failed to create new icon. Restoring backup..."
        if (Test-Path "icon.ico.backup") {
            Remove-Item "icon.ico"
            Rename-Item "icon.ico.backup" "icon.ico"
        }
    }
} else {
    Write-Host "icon.ico not found in current directory"
}

Write-Host "Icon improvement process completed."

