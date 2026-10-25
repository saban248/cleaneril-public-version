import os
from enum import IntFlag, Enum

from api.databases.ptc import ServerConfig


class OFFiles(IntFlag):
    BKMVDATA = 1<<0
    INI      = 1<<1


class OFConfig:
    FOLDER_NAME = 'openformat'
    OF_PATH         = os.path.join(ServerConfig.API_PATH, FOLDER_NAME)
    EXPORT_PATH     = os.path.join(OF_PATH, 'exports')
    filename_bkmv  = OFFiles.BKMVDATA.name
    filename_bkmv_txt = "txt." + str(filename_bkmv)
    filename_bkmv_zip = filename_bkmv + ".zip"
    filename_ini        = OFFiles.INI.name
    filename_ini_txt =  'txt.' + str(filename_ini)
    encoding            = 'iso-8859-8'
    VERSION             = '&1.31OF&'
    SOFTWARE_NUM        = 0
    INI_LENGTH          = 1280
    SOFTWARE_VAT_ID     = 0





class OFRecordLengths(Enum):
    v100A = 95
    v100C = 444
    v110D = 339
    v120D = 222
    v900Z = 110

    @property
    def name(self):
        return super().name.replace("v", "")

    @classmethod
    def list_names(cls):
        return [flag.name for flag in cls]

    @staticmethod
    def get_by_name(name):
        for flag in OFRecordLengths:
            if flag.name == name:
                return flag

        return None





