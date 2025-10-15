import React from "react";

export default function AddFileModal({
  setShowAddFile,
  pickedFile,
  setPickedFile,
  fileUnlockDate,
  setFileUnlockDate,
  addFile,
  pickFileForAdd,
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-window space-y-4">
        <h2 className="text-xl font-semibold text-center">Add New File</h2>

        <div className="space-y-2">
          <label className="block text-sm">File</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pickedFile}
              readOnly
              className="flex-1 rounded-md border px-2 py-1 bg-transparent outline-none"
            />
            <button onClick={pickFileForAdd}>Browse</button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Unlock Date</label>
          <input
            type="datetime-local"
            value={
              fileUnlockDate
                ? new Date(fileUnlockDate).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) => setFileUnlockDate(new Date(e.target.value))}
            className="w-full rounded-md border px-2 py-1 bg-transparent outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setShowAddFile(false)}>Cancel</button>
          <button onClick={addFile}>Add</button>
        </div>
      </div>
    </div>
  );
}
