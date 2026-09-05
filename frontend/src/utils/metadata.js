// Helpers for the IPFS metadata object. This shape is what we will pin to Pinata later.

export function buildMetadata(fields) {
  return {
    name: 'Certificate: ' + (fields.course || fields.title || 'Credential'),
    description: 'Issued to ' + (fields.student || '') + ' by ' + (fields.institution || ''),
    image: '',
    attributes: [
      { trait_type: 'student', value: fields.student || '' },
      { trait_type: 'studentId', value: fields.studentId || '' },
      { trait_type: 'course', value: fields.course || '' },
      { trait_type: 'institution', value: fields.institution || '' },
      { trait_type: 'grade', value: fields.grade || '' },
      { trait_type: 'date', value: fields.date || '' },
      { trait_type: 'expiry', value: fields.expiry || '' },
      { trait_type: 'skills', value: fields.skills || '' },
      { trait_type: 'title', value: fields.title || '' },
      { trait_type: 'summary', value: fields.description || '' },
    ],
  }
}

// Read one attribute out of a metadata object.
export function getAttr(metadata, key) {
  if (!metadata || !Array.isArray(metadata.attributes)) return ''
  const found = metadata.attributes.find((a) => a.trait_type === key)
  return found ? found.value : ''
}
