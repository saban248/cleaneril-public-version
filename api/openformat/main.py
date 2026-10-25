import os.path

from api.openformat.ptc import OFConfig
import zipfile



def write_to_bkmvd(path,data:str):
    with open(os.path.join(path, OFConfig.filename_bkmv_txt), "w", encoding="iso-8859-8", newline="") as f:
        f.write(data)


def write_to_ini(path,data:str):
    with open(os.path.join(path, OFConfig.filename_ini_txt), "w",encoding="iso-8859-8",newline="") as f:
        f.write(data)



def write_bkmv_to_zip(path):
    with zipfile.ZipFile(os.path.join(path,str(OFConfig.filename_bkmv_zip)),"w",zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join(path, str(OFConfig.filename_bkmv_txt)), arcname=OFConfig.filename_bkmv_txt)