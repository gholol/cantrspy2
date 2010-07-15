<?php
$air_path = 'http://cantrspy2.googlecode.com/svn/trunk/published/';
$version = '2.6.9';
$air = $air_path . 'cantrspy_2_6_9.air';
$option = key($_GET);
if ($option === 'update') {
    $notes = file_get_contents('changes.log');
    echo <<<•
<?xml version="1.0" encoding="utf-8"?>
<update xmlns="http://ns.adobe.com/air/framework/update/description/1.0">
<version>$version</version><url>$air</url><description><![CDATA[$notes]]></description>
</update>
•;

file_put_contents('update.log',
$_SERVER['REQUEST_TIME'   ].' '.
$_SERVER['REMOTE_ADDR'    ].' '.
$_SERVER['REQUEST_URI'    ]."\n",
FILE_APPEND);

} else {
    if ($option !== null) {
        $m = array();
        if (preg_match('/^(\d+)[_\.](\d+)[_\.](\d+)$/', $option, $m) !== 1) die;
        $air = 'cantrspy_'.$m[1].'_'.$m[2].'_'.$m[3].'.air';
        $air = $air_path . $air;
        $version = $m[1].'.'.$m[2].'.'.$m[3];
    }
    echo <<<•
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html><head>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
    <link rel="icon" href="icon.ico" />
    <title>CantrSpy Installation Page</title>
    <script language="JavaScript" type="text/javascript"><!--
        var requiredMajorVersion = 9, requiredMinorVersion = 0, requiredRevision = 115;
    // --></script>
    <style type="text/css"><!--
        .centred { position: fixed; display: table; width: 100%; height: 100% }
        .centred > * { display: table-cell; text-align: center; vertical-align: middle }
        body { font-family: Verdana, Arial, sans-serif; background-color: #004000; color: #FFF; }
        :link, :visited { text-decoration: none; color: #FFF; }
    --></style>
</head><body>
    <span class="centred"><span>
        <script src="assets/AC_RunActiveContent.js" type="text/javascript"></script>
        <script language="JavaScript" type="text/javascript">
        <!--
        document.write(
        '<div class="title" style="font-size: 24pt; font-weight: bold; padding-bottom: 20px">' +
            'CantrSpy $version' +
        '</div>');
        if (DetectFlashVer(requiredMajorVersion, requiredMinorVersion, requiredRevision)) {
            AC_FL_RunContent('codebase', 'http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab',
            'width','217', 'height','180', 'id','badge', 'align','middle', 'src','assets/badge',
            'quality','high', 'bgcolor','#004000', 'name','badge', 'allowscriptaccess','all',
            'pluginspage','http://www.macromedia.com/go/getflashplayer',
            'flashvars','appname=CantrSpy&appurl=$air&airversion=1.5.1&imageurl=assets/badge.png&buttoncolor=000000&messagecolor=FFFFFF',
            'movie','assets/badge');
        } else {
            document.write(
            '<a href="$air" style="display: inline-block">' +
                '<img src="assets/icon.png" width="192" height="192" border="0" title="" />' +
                '<div style="font-size: 16pt; padding: 10px;">Click to Download</div>' +
            '</a>' +
            '<p style="font-size: 10pt">Requires <a style="font-weight: bold" href="http://get.adobe.com/air">Adobe AIR</a></p>');
        } // -->
        </script>
    </span></span>
</body></html>
•;
}
?>