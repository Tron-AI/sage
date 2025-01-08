import pyodbc 
import datetime
from homologation.models import HomologationConfiguration

def save_file_to_sql_server(file, origin, uploaded_by):
    """
    Save uploaded file information with size validation.
    """
    try:
        # Read file content first to validate size
        file_content = file.read()
        file_size_gb = len(file_content) / (1024 * 1024 * 1024)  # Convert to GB
        
        if file_size_gb > 1.8:  # Setting limit below 2GB to allow overhead
            raise Exception(f"File size ({file_size_gb:.2f} GB) exceeds maximum limit of 1.8 GB")
            
        # Fetch the single record from HomologationConfiguration
        config = HomologationConfiguration.objects.get()  # Assuming only one record exists
        
        # Extract SFTP details from the fetched configuration
        sftp_ip = config.sftp_ip
        sftp_user = config.sftp_user
        sftp_password = config.sftp_password

        # Create connection string
        conn = pyodbc.connect(
            f'DRIVER={{ODBC Driver 17 for SQL Server}};'
            f'SERVER={sftp_ip},1439;'
            f'DATABASE=STRATEGIO_HOMOLOGACION;'
            f'UID={sftp_user};'
            f'PWD={sftp_password}'
        )
        
        cursor = conn.cursor()
        
        query = """
        INSERT INTO ArchivosDeExcel (ContenidoDelArchivo, OrigenDelArchivo, SubidoPor, FechaDeCarga)
        VALUES (?, ?, ?, ?)
        """
        upload_date = datetime.datetime.now()
        cursor.execute(query, (pyodbc.Binary(file_content), origin, uploaded_by, upload_date))
        
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        raise Exception(f"Failed to save file to database: {str(e)}")
