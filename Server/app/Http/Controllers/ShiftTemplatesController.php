<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShiftTemplateRequest;
use App\Services\ShiftTemplateService;

class ShiftTemplatesController extends Controller
{
    protected ShiftTemplateService $shiftTemplateService;

    public function __construct(ShiftTemplateService $shiftTemplateService)
    {
        $this->shiftTemplateService = $shiftTemplateService;
    }

    public function getTemplates()
    {
        $templates = $this->shiftTemplateService->listTemplates();

        return $this->responseJSON($templates, 'success', 200);
    }

    public function createTemplate(StoreShiftTemplateRequest $request)
    {
        $template = $this->shiftTemplateService->createTemplate($request->validated());

        return $this->responseJSON($template, 'success', 201);
    }
}
