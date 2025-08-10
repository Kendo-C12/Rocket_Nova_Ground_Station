
#include <windows.h>
#include <iostream>
#include <string>
#include <thread>
#include <chrono>

using namespace std;

int main() {
    wstring portName = L"\\\\.\\COM5";
    
    HANDLE hSerial = CreateFileW(
        portName.c_str(),
        GENERIC_WRITE,
        0,
        0,
        OPEN_EXISTING,
        0,
        0
    );

    if (hSerial == INVALID_HANDLE_VALUE) {
        cerr << "❌ Error opening COM port" << endl;
        return 1;
    }

    cout << "✅ Sending data to " << string(portName.begin(), portName.end()) << endl;

    while (true) {
        string data = "25.3,58,812\n";
        DWORD bytesWritten;
        WriteFile(hSerial, data.c_str(), data.size(), &bytesWritten, NULL);

        cout << "Sent: " << data;

        this_thread::sleep_for(chrono::seconds(1));
    }

    CloseHandle(hSerial);
    return 0;
}
