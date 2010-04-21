<?php

if ($_REQUEST['requestkey'] == "1") {
    echo "10001\n";
    echo "96029d9b2c3e150a582af0012b7f0a95\n";
    echo "19";
} else {
    require_once "jcrypt/jCryption-1.0.1.php";
    $jCryption = new jCryption;

    $decrpass = $jCryption->decrypt(
        $_REQUEST['pass'],
        "32144247554415158744256763037986114013",
        "199397780593819806807529031897016371861"
    );
    if ($_REQUEST['ver'] == "1.0.1.") {
        if (($_REQUEST['id'] == "83913") && ($decrpass == "cantrtest")) {
            echo "OK LIST\n" .
                 "Ecaftnuc\n" .
                 "Quarantine";
        }
        else {
            echo "BAD LOGIN";
        }
    }
    else {
        echo "ERROR Hacking attempt";
    }
}

?>