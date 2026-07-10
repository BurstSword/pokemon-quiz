Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\\src\\assets\\icons"
$iconsDir = [System.IO.Path]::GetFullPath($iconsDir)
[System.IO.Directory]::CreateDirectory($iconsDir) | Out-Null

function New-BrushColor([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Save-PokeQuizIcon([int]$size, [string]$path, [bool]$maskable) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear((New-BrushColor "#fff8f6"))

  if ($maskable) {
    $graphics.Clear((New-BrushColor "#d32f3a"))
  }

  $circleSize = if ($maskable) { $size * 0.70 } else { $size * 0.68 }
  $circleX = ($size - $circleSize) / 2
  $circleY = ($size - $circleSize) / 2
  $circleRect = New-Object System.Drawing.RectangleF $circleX, $circleY, $circleSize, $circleSize

  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $circleRect,
    (New-BrushColor "#ff8a72"),
    (New-BrushColor "#991433"),
    45
  )
  $graphics.FillEllipse($gradient, $circleRect)

  $dividerPen = New-Object System.Drawing.Pen (New-BrushColor "#fff7f4"), ([Math]::Max(4, $size * 0.075))
  $dividerPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $dividerPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $dividerY = $size * 0.50
  $graphics.DrawLine($dividerPen, $size * 0.25, $dividerY, $size * 0.75, $dividerY)

  $coreRadius = $size * 0.095
  $coreRect = New-Object System.Drawing.RectangleF (($size / 2) - $coreRadius), (($size / 2) - $coreRadius), ($coreRadius * 2), ($coreRadius * 2)
  $coreBrush = New-Object System.Drawing.SolidBrush (New-BrushColor "#132033")
  $corePen = New-Object System.Drawing.Pen (New-BrushColor "#ffffff"), ([Math]::Max(2, $size * 0.03))
  $graphics.FillEllipse($coreBrush, $coreRect)
  $graphics.DrawEllipse($corePen, $coreRect)

  $fontFamily = New-Object System.Drawing.FontFamily "Segoe UI Black"
  $questionPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $stringFormat = New-Object System.Drawing.StringFormat
  $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

  $questionRect = New-Object System.Drawing.RectangleF ($size * 0.26), ($size * 0.14), ($size * 0.48), ($size * 0.40)
  $questionPath.AddString("?", $fontFamily, [int][System.Drawing.FontStyle]::Bold, ($size * 0.34), $questionRect, $stringFormat)
  $questionPen = New-Object System.Drawing.Pen (New-BrushColor "#ffffff"), ([Math]::Max(3, $size * 0.022))
  $questionPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $graphics.DrawPath($questionPen, $questionPath)

  $dotBrush = New-Object System.Drawing.SolidBrush (New-BrushColor "#ffffff")
  $dotRadius = $size * 0.028
  $graphics.FillEllipse($dotBrush, ($size * 0.515) - $dotRadius, ($size * 0.62) - $dotRadius, $dotRadius * 2, $dotRadius * 2)

  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $questionPen.Dispose()
  $dividerPen.Dispose()
  $corePen.Dispose()
  $coreBrush.Dispose()
  $dotBrush.Dispose()
  $gradient.Dispose()
  $questionPath.Dispose()
  $stringFormat.Dispose()
  $fontFamily.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$sizes = 72, 96, 128, 144, 152, 192, 384, 512
foreach ($size in $sizes) {
  Save-PokeQuizIcon $size (Join-Path $iconsDir "icon-$size`x$size.png") $false
}

Save-PokeQuizIcon 512 (Join-Path $iconsDir "icon-maskable-512x512.png") $true
